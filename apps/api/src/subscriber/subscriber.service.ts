import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import {
  replaceInterestsOps,
  validateCategoryIds,
} from 'src/common/user-interests';
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
      select: { id: true, subscribers: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} does not exist.`);
    }

    const existing = user.subscribers[0];
    if (existing?.status === 'active') {
      throw new ConflictException('User is already subscribed.');
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

    if (!categoryIds) return subscribe;

    const results = await this.prisma.$transaction([
      ...replaceInterestsOps(this.prisma, userId, categoryIds),
      subscribe,
    ]);
    return results[results.length - 1];
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
      throw new NotFoundException(
        'No active subscription found for this user.',
      );
    }

    return this.prisma.subscriber.update({
      where: { id: subscription.id },
      data: { status: 'paused' },
    });
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
      throw new NotFoundException('No subscription found for this user.');
    }

    // 구독 취소: 관심사를 비우고 구독 상태를 바꿉니다. 둘 중 하나만 반영되지 않도록 한 트랜잭션으로 처리합니다.
    // 북마크는 구독과 별개인 사용자 데이터이므로 지우지 않습니다.
    const [, cancelled] = await this.prisma.$transaction([
      this.prisma.userInterest.deleteMany({ where: { userId } }),
      this.prisma.subscriber.update({
        where: { id: subscription.id },
        data: { status: 'cancelled', endAt: new Date() },
      }),
    ]);
    return cancelled;
  }

  /**
   * 현재 구독 상태 조회
   * @param userId 사용자 ID
   */
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
      throw new NotFoundException(`User with ID ${userId} does not exist.`);
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
      };
    });

    return subscribersWithInterest;
  }
}
