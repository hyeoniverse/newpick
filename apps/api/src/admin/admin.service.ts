import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { deleteAccount } from 'src/common/delete-account';
import { AppException } from '../common/errors/app.exception';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly crawlingRepository: CrawlingRepository,
  ) {}

  /**
   * 사용자 목록 (#31): 이메일 · 이름 일부 · 권한으로 찾기, 최근 가입부터.
   * 구독 상태 · 관심사 · 북마크 수를 함께 (토큰 · 알림 설정 같은 내부 값은 빼고)
   */
  async getUsers(q: {
    q?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(q.role && { role: q.role }),
      ...(q.q && {
        OR: [{ email: { contains: q.q } }, { username: { contains: q.q } }],
      }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: q.offset ?? 0,
        take: q.limit ?? 20,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          interests: {
            select: { categoryId: true },
            orderBy: { categoryId: 'asc' },
          },
          subscribers: { select: { status: true, startedAt: true } },
          _count: { select: { bookmarks: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      total,
      items: rows.map(({ interests, subscribers, _count, ...user }) => ({
        ...user,
        interests: interests.map((i) => i.categoryId),
        subscription: subscribers[0]?.status ?? null,
        bookmarks: _count.bookmarks,
      })),
    };
  }

  /**
   * 구독자 목록 (#31): 구독 상태 · 관심사 · 이메일로 찾기, 최근 시작부터
   */
  async getSubscribers(q: {
    q?: string;
    status?: string;
    categoryId?: number;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.SubscriberWhereInput = {
      ...(q.status && { status: q.status }),
      user: {
        ...(q.q && {
          OR: [{ email: { contains: q.q } }, { username: { contains: q.q } }],
        }),
        ...(q.categoryId && {
          interests: { some: { categoryId: q.categoryId } },
        }),
      },
    };
    const [rows, total, counts] = await Promise.all([
      this.prisma.subscriber.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: q.offset ?? 0,
        take: q.limit ?? 20,
        select: {
          id: true,
          status: true,
          startedAt: true,
          endAt: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              interests: {
                select: { categoryId: true },
                orderBy: { categoryId: 'asc' },
              },
            },
          },
        },
      }),
      this.prisma.subscriber.count({ where }),
      this.prisma.subscriber.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);
    return {
      total,
      // 상태별 전체 수 (거르기와 상관없이): 구독 중 · 일시 정지 · 해지
      byStatus: Object.fromEntries(
        counts.map((c) => [c.status, c._count._all]),
      ),
      items: rows.map(({ user, ...sub }) => ({
        ...sub,
        userId: user.id,
        email: user.email,
        username: user.username,
        interests: user.interests.map((i) => i.categoryId),
      })),
    };
  }

  /**
   * 관심사(카테고리) 현황 (#31): 발행한 뉴스레터 수 · 마지막 발행, 고른 사용자 · 그중 구독 중, 최근 30일 수집 기사.
   * 관심사 이름은 수집(네이버 섹션) · 화면 상수와 묶여 있어 여기서는 보기만 한다
   */
  async getCategories() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [categories, newsletterStats, interested, subscribed] =
      await Promise.all([
        this.prisma.newsCategory.findMany({ orderBy: { id: 'asc' } }),
        this.prisma.newsletter.groupBy({
          by: ['categoryId'],
          _count: { _all: true },
          _max: { createdAt: true },
        }),
        this.prisma.userInterest.groupBy({
          by: ['categoryId'],
          _count: { _all: true },
        }),
        this.prisma.userInterest.groupBy({
          by: ['categoryId'],
          where: { user: { subscribers: { some: { status: 'active' } } } },
          _count: { _all: true },
        }),
      ]);
    const articleCounts = await Promise.all(
      categories.map((c) =>
        this.crawlingRepository.countByCategorySince(c.name, since),
      ),
    );
    const byId = <T extends { categoryId: number }>(rows: T[], id: number) =>
      rows.find((r) => r.categoryId === id);
    return categories.map((c, i) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      newsletters: byId(newsletterStats, c.id)?._count._all ?? 0,
      lastNewsletterAt: byId(newsletterStats, c.id)?._max.createdAt ?? null,
      interestedUsers: byId(interested, c.id)?._count._all ?? 0,
      activeSubscribers: byId(subscribed, c.id)?._count._all ?? 0,
      articles30d: articleCounts[i],
    }));
  }

  /** 회원 탈퇴와 같은 경로: 메일 발송 기록까지 함께 지운다 (#65) */
  async deleteUser(id: number, actorId?: number) {
    if (actorId === id) {
      throw new AppException(
        'BAD_REQUEST',
        '내 계정은 여기서 지울 수 없어요. 마이페이지에서 탈퇴해 주세요.',
      );
    }
    return deleteAccount(this.prisma, id);
  }

  async getAllBookmarks() {
    return this.prisma.bookmark.findMany({
      include: {
        user: true, // 각 북마크와 관련된 사용자 정보 포함
      },
    });
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(id: number, updateDto: UpdateUserDto, actorId?: number) {
    // 자기 권한을 내리면 관리자 화면에서 바로 쫓겨나므로 막는다
    if (actorId === id && updateDto.role !== 'admin') {
      throw new AppException('BAD_REQUEST', '내 권한은 여기서 바꿀 수 없어요.');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppException('USER_NOT_FOUND');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: updateDto.role },
    });
  }
}
