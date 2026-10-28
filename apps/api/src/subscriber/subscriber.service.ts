import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import {
  replaceInterestsOps,
  validateCategoryIds,
} from 'src/common/user-interests';
import { AppException } from '../common/errors/app.exception';
import { subscriptionEvent } from '../common/subscription-event';
@Injectable()
export class SubscriberService {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: MysqlPrismaService,
  ) {}

  /**
   * 구독 시작 (관심사 저장 포함)
   * 이미 구독 중인지 먼저 확인한 뒤, 관심사 저장과 구독 상태 변경을 한 트랜잭션으로 처리합니다.
   * (이전에는 관심사를 먼저 덮어쓴 뒤 중복 구독을 확인해, 409가 나도 관심사는 바뀌어 있었습니다.)
   * @param userId 사용자 ID
   * @param interests 관심사 ID 배열 (생략하면 기존 관심사 유지)
   */
  async startSubscription(userId: number, interests?: number[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscribers: true,
        interests: { select: { categoryId: true } },
      },
    });
    if (!user) {
      throw new AppException('USER_NOT_FOUND');
    }

    const existing = user.subscribers[0];
    if (existing?.status === 'active') {
      throw new AppException('ALREADY_SUBSCRIBED');
    }

    const categoryIds = interests
      ? await validateCategoryIds(this.prisma, interests)
      : null;

    const subscribe = existing
      ? this.prisma.subscriber.update({
          where: { id: existing.id },
          data: { startedAt: new Date(), endAt: null, status: 'active' },
        })
      : this.prisma.subscriber.create({
          data: { userId, startedAt: new Date(), status: 'active' },
        });

    // 구독 기록 (#122): 일시정지였으면 다시 시작, 아니면 새 구독. 그때의 관심사도 남긴다
    const event = subscriptionEvent(
      this.prisma,
      userId,
      existing?.status === 'paused' ? 'resume' : 'subscribe',
      categoryIds ?? user.interests.map((i) => i.categoryId),
    );

    const results = await this.prisma.$transaction([
      ...(categoryIds
        ? replaceInterestsOps(this.prisma, userId, categoryIds)
        : []),
      subscribe,
      event,
    ]);
    return results[results.length - 2];
  }

  /**
   * 구독 일시정지
   * @param userId 사용자 ID
   */
  async pauseSubscription(userId: number) {
    const subscription = await this.prisma.subscriber.findFirst({
      where: { userId, status: 'active' },
    });

    if (!subscription) {
      throw new AppException(
        'SUBSCRIPTION_NOT_FOUND',
        '진행 중인 구독이 없습니다.',
      );
    }

    const [paused] = await this.prisma.$transaction([
      this.prisma.subscriber.update({
        where: { id: subscription.id },
        data: { status: 'paused' },
      }),
      subscriptionEvent(this.prisma, userId, 'pause'),
    ]);
    return paused;
  }

  /**
   * 구독 해지
   * @param userId 사용자 ID
   */
  async cancelSubscription(userId: number) {
    const subscription = await this.prisma.subscriber.findFirst({
      where: { userId },
    });

    if (!subscription) {
      throw new AppException('SUBSCRIPTION_NOT_FOUND');
    }

    // 구독 취소: 관심사를 비우고 구독 상태를 바꿉니다. 둘 중 하나만 반영되지 않도록 한 트랜잭션으로 처리합니다.
    // 북마크는 구독과 별개인 사용자 데이터이므로 지우지 않습니다.
    // 이미 해지한 구독을 다시 해지하면 기록은 남기지 않는다 (통계에 두 번 세지 않게)
    const [, cancelled] = await this.prisma.$transaction([
      this.prisma.userInterest.deleteMany({ where: { userId } }),
      this.prisma.subscriber.update({
        where: { id: subscription.id },
        data: { status: 'cancelled', endAt: new Date() },
      }),
      ...(subscription.status === 'cancelled'
        ? []
        : [subscriptionEvent(this.prisma, userId, 'cancel')]),
    ]);
    return cancelled;
  }

  /**
   * 현재 구독 상태 조회
   * @param userId 사용자 ID
   */
  /**
   * 원클릭 해지 대상 (#18). 로그인 없이 토큰으로 온다.
   * 메일 주소는 가려서 돌려준다 (확인 화면용). 없는 회원이면 null
   */
  async unsubscribeTarget(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) return null;
    const { status } = await this.getSubscriptionStatus(userId);
    return {
      email: maskEmail(user.email),
      subscribed: status === 'active' || status === 'paused',
    };
  }

  /**
   * 원클릭 해지 (#18). 진행 중(구독 · 일시정지)이면 해지하고, 이미 해지했거나 구독한 적이 없으면 그대로 둔다.
   * 메일 앱이 여러 번 보내도 같은 결과가 되게 한다
   */
  async unsubscribeOneClick(userId: number) {
    const active = await this.prisma.subscriber.findFirst({
      where: { userId, status: { in: ['active', 'paused'] } },
    });
    if (!active) return { unsubscribed: false };
    await this.cancelSubscription(userId);
    this.logger.log(`원클릭 수신 거부: 회원 ${userId}`);
    return { unsubscribed: true };
  }

  async getSubscriptionStatus(userId: number) {
    const subscription = await this.prisma.subscriber.findFirst({
      where: { userId, status: { in: ['active', 'paused'] } },
    });

    if (!subscription) {
      return { active: false, status: 'none' };
    }

    return {
      active: subscription.status === 'active',
      status: subscription.status,
    };
  }

  /**
   * 구독 기록 조회
   * @param userId 사용자 ID
   */
  async getSubscriptionHistory(userId: number) {
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new AppException('USER_NOT_FOUND');
    }

    return this.prisma.subscriber.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * 구독자 목록 조회
   */
  async getSubscribers(): Promise<
    {
      email: string;
      interests: number[];
      name: string;
      userId: number;
    }[]
  > {
    const recievers = await this.prisma.subscriber.findMany({
      include: {
        user: {
          include: { interests: { select: { categoryId: true } } },
        },
      },
      where: {
        status: 'active',
      },
    });

    this.logger.debug(
      `수신자 목록을 가져왔습니다. 수신자 수: ${recievers.length}`,
    );
    const subscribersWithInterest = recievers.map((reciever) => {
      return {
        email: reciever.user.email,
        interests: reciever.user.interests.map((i) => i.categoryId),
        name: reciever.user.username,
        userId: reciever.userId,
      };
    });

    return subscribersWithInterest;
  }
}

/** 확인 화면에 보일 메일 주소: 앞 두 글자만 남기고 가린다 (hy***@gmail.com) */
export function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!domain) return '***';
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(3, name.length - 2))}@${domain}`;
}
