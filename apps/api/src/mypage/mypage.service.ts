import type { MailPlan } from '../edition/personalize';
import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import {
  getInterestIds,
  replaceInterestsOps,
  validateCategoryIds,
} from 'src/common/user-interests';
import { deleteAccount } from 'src/common/delete-account';
import { AppException } from '../common/errors/app.exception';
import { EditionService } from '../edition/edition.service';
import { assertOwnFolder } from './folders.service';

/** 북마크 목록에 쓰는 뉴스레터 칸 */
const BOOKMARK_NEWSLETTER = {
  id: true,
  title: true,
  imageUrl: true,
  content: true,
  createdAt: true,
  viewcount: true,
  category: { select: { id: true, name: true } },
} as const;

/** 북마크 한 줄을 화면 모양으로 */
const toBookmarkItem = ({
  newsletter,
  createdAt,
  folderId,
}: {
  createdAt: Date;
  folderId: number | null;
  newsletter: {
    id: number;
    title: string;
    imageUrl: string | null;
    content: string | null;
    createdAt: Date;
    viewcount: number;
    category: { id: number; name: string };
  };
}) => ({
  bookmarkedAt: createdAt,
  folderId,
  viewcount: newsletter.viewcount,
  id: newsletter.id,
  newsTitle: newsletter.title,
  newsImg: newsletter.imageUrl || null,
  newsCreatedAt: newsletter.createdAt,
  newsSummary: newsletter.content
    ? newsletter.content.substring(0, 100) + '...'
    : null,
  category: newsletter.category,
});

/** 받은 달 (한국 시각 'YYYY-MM') */
const kstMonth = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })
    .format(date)
    .slice(0, 7);

/**
 * 보낸 시각들을 정렬 순서대로 달로 묶어 달마다 통수와 그 달 첫 메일의 순번(0부터)을 준다.
 * 마이페이지 '내 뉴스레터'의 달 막대에서 그 달로 바로 가기(쪽 = 순번 / 한 쪽 수)에 쓴다
 */
export function monthIndex(sentAts: Date[], order: 'desc' | 'asc') {
  const sorted = [...sentAts].sort((a, b) =>
    order === 'asc' ? a.getTime() - b.getTime() : b.getTime() - a.getTime(),
  );
  const months: { month: string; count: number; firstIndex: number }[] = [];
  sorted.forEach((sentAt, i) => {
    const month = kstMonth(sentAt);
    const last = months[months.length - 1];
    if (last?.month === month) last.count += 1;
    else months.push({ month, count: 1, firstIndex: i });
  });
  return months;
}

@Injectable()
export class MyPageService {
  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly editionService: EditionService,
  ) {}

  /** 회원 탈퇴: 회원 정보와 관심 분야·구독·북마크·발송 기록을 함께 지운다 (#65) */
  async deleteAccount(userId: number) {
    return deleteAccount(this.prisma, userId);
  }

  /**
   * 사용자 프로필 조회
   * @param userId 사용자 ID
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        profileImg: true,
        timezone: true,
        // 관리자 화면(/admin) 접근 여부를 웹이 판단한다. 실제 권한 확인은 API의 @AdminOnly
        role: true,
        interests: {
          select: { categoryId: true },
          orderBy: { categoryId: 'asc' },
        },
      },
    });

    if (!user) {
      throw new AppException('USER_NOT_FOUND');
    }

    // 응답 형태는 이전과 같이 interests: number[]
    return {
      ...user,
      interests: user.interests.map((interest) => interest.categoryId),
    };
  }

  /**
   * 북마크한 뉴스레터 조회
   * @param userId 사용자 ID
   */
  async getBookmarks(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { newsletter: { select: BOOKMARK_NEWSLETTER } },
    });

    // 북마크 아이콘(눌렀는지) · 개수에 쓰는 전체 목록. 마이페이지 북마크 탭은 쪽 단위(getBookmarkPage)
    return bookmarks.map(toBookmarkItem);
  }

  /**
   * 마이페이지 북마크 한 쪽 (#123). 폴더 · 관심사로 거르고 북마크한 순 · 발행일순 · 조회수순으로.
   * 폴더 줄 개수(전체 · 폴더 없음)와 거르기 칩에 쓸 '내 북마크에 있는 관심사'도 같이 준다
   */
  async getBookmarkPage(
    userId: number,
    {
      offset = 0,
      limit = 24,
      folder,
      categoryId,
      sort = 'bookmarked',
    }: {
      offset?: number;
      limit?: number;
      folder?: 'none' | number;
      categoryId?: number;
      sort?: 'bookmarked' | 'published' | 'views';
    } = {},
  ) {
    const mine = { userId };
    const where = {
      ...mine,
      ...(folder !== undefined && {
        folderId: folder === 'none' ? null : folder,
      }),
      ...(categoryId && { newsletter: { categoryId } }),
    };
    const orderBy =
      sort === 'published'
        ? [
            { newsletter: { createdAt: 'desc' as const } },
            { id: 'desc' as const },
          ]
        : sort === 'views'
          ? [
              { newsletter: { viewcount: 'desc' as const } },
              { id: 'desc' as const },
            ]
          : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
    const [rows, total, all, unfiled, categories] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: { newsletter: { select: BOOKMARK_NEWSLETTER } },
      }),
      this.prisma.bookmark.count({ where }),
      this.prisma.bookmark.count({ where: mine }),
      this.prisma.bookmark.count({ where: { ...mine, folderId: null } }),
      this.prisma.newsCategory.findMany({
        where: { newsletters: { some: { bookmarks: { some: mine } } } },
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      }),
    ]);
    return {
      items: rows.map(toBookmarkItem),
      total,
      counts: { all, unfiled },
      categories,
    };
  }

  /**
   * 내가 실제로 받은 메일 (내 뉴스레터 탭). 발송 기록(email_archives)을 보낸 시각별로 묶어 한 통씩.
   * 메일 본문은 저장하지 않으므로, 그 메일에 엮어 보낸 뉴스레터들로 보여 준다. 최신 메일부터
   */
  /** 북마크 폴더 옮기기 (#123): 내 북마크만, 폴더도 내 것 (null = 폴더 없음) */
  async moveBookmarks(
    userId: number,
    newsletterIds: number[],
    folderId: number | null,
  ) {
    if (folderId) await assertOwnFolder(this.prisma, userId, folderId);
    const { count } = await this.prisma.bookmark.updateMany({
      where: { userId, newsletterId: { in: [...new Set(newsletterIds)] } },
      data: { folderId },
    });
    return { count };
  }

  /**
   * 받은 메일 한 통 표시 (#123): 중요 · 폴더 중 준 것만 바꾼다. 내가 받은 메일이어야 하고,
   * 표시가 처음이면 줄을 만든다 (메일은 보낸 시각으로 가리킨다)
   */
  async markMail(
    userId: number,
    sentAt: Date,
    changes: { starred?: boolean; folderId?: number | null },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new AppException('USER_NOT_FOUND');
    const received = await this.prisma.emailArchive.findFirst({
      where: { email: user.email, sentAt },
      select: { id: true },
    });
    if (!received)
      throw new AppException('NOT_FOUND', '받은 메일을 찾을 수 없어요.');
    if (changes.folderId)
      await assertOwnFolder(this.prisma, userId, changes.folderId);
    const data = {
      ...(changes.starred !== undefined && { starred: changes.starred }),
      ...(changes.folderId !== undefined && { folderId: changes.folderId }),
    };
    return this.prisma.mailMark.upsert({
      where: { userId_sentAt: { userId, sentAt } },
      create: { userId, sentAt, ...data },
      update: data,
      select: { sentAt: true, starred: true, folderId: true },
    });
  }

  async getMails(
    userId: number,
    offset = 0,
    limit = 5,
    filters: {
      starred?: boolean;
      folder?: 'none' | number;
      categoryId?: number;
      order?: 'desc' | 'asc';
    } = {},
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new AppException('USER_NOT_FOUND');

    // 중요 · 폴더 거르기는 표시(mail_marks)에서 보낸 시각을 골라 건다
    const marks = await this.prisma.mailMark.findMany({
      where: { userId },
      select: { sentAt: true, starred: true, folderId: true },
    });
    const markOf = new Map(marks.map((m) => [m.sentAt.getTime(), m]));
    const pick = (keep: (m: (typeof marks)[number]) => boolean) =>
      marks.filter(keep).map((m) => m.sentAt);
    const sentAtFilter =
      filters.starred || typeof filters.folder === 'number'
        ? {
            in: pick(
              (m) =>
                (!filters.starred || m.starred) &&
                (typeof filters.folder !== 'number' ||
                  m.folderId === filters.folder),
            ),
          }
        : filters.folder === 'none'
          ? { notIn: pick((m) => m.folderId !== null) }
          : undefined;
    const base = { email: user.email };
    const where = {
      ...base,
      ...(sentAtFilter && { sentAt: sentAtFilter }),
      ...(filters.categoryId && {
        newsletter: { categoryId: filters.categoryId },
      }),
    };
    const [sends, all, everything] = await Promise.all([
      this.prisma.emailArchive.groupBy({
        by: ['sentAt'],
        where,
        orderBy: { sentAt: filters.order ?? 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.emailArchive.groupBy({ by: ['sentAt'], where }),
      // 폴더 줄 · 거르기 칩의 개수 (거르기와 상관없이 전체 기준)
      this.prisma.emailArchive.groupBy({ by: ['sentAt'], where: base }),
    ]);
    const counts = {
      all: everything.length,
      starred: marks.filter((m) => m.starred).length,
      unfiled:
        everything.length - marks.filter((m) => m.folderId !== null).length,
    };
    // 달 이동용: 거르기 · 정렬을 적용한 순서로 달마다 통수와 그 달 첫 메일의 순번 (쪽 계산은 화면에서)
    const months = monthIndex(
      all.map((a) => a.sentAt),
      filters.order ?? 'desc',
    );
    if (!sends.length) return { items: [], total: all.length, counts, months };

    const archives = await this.prisma.emailArchive.findMany({
      where: { ...where, sentAt: { in: sends.map((s) => s.sentAt) } },
      orderBy: { newsletter: { categoryId: 'asc' } },
      select: {
        sentAt: true,
        newsletter: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            imageUrl: true,
            content: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 메일 제목 · 짜임새(오늘 한눈에 · 흐름 · 분야별 소식 · 관전 포인트)를 발송 때와 같은 방식으로 다시 엮는다 (AI 호출 없음).
    // 메일은 사이트 뉴스레터를 그대로 붙인 게 아니라 고른 분야로 다시 엮은 것이라, 목록도 그 짜임새로 보여 준다
    // 맞춤 메일(#123 3단계)은 그때의 계획으로 (받은 그대로)
    const plans = await this.prisma.mailPlan.findMany({
      where: { email: where.email, sentAt: { in: sends.map((s) => s.sentAt) } },
      select: { sentAt: true, plan: true },
    });
    const planAt = (sentAt: Date) =>
      (plans.find((p) => p.sentAt.getTime() === sentAt.getTime())?.plan ??
        null) as MailPlan | null;
    const digests = await Promise.all(
      sends.map(({ sentAt }) =>
        this.editionService.rebuildDigest(
          sentAt,
          archives
            .filter((a) => a.sentAt.getTime() === sentAt.getTime())
            .map((a) => a.newsletter.id),
          planAt(sentAt),
        ),
      ),
    );
    const subjects = digests.map((d) => d?.subject ?? null);

    return {
      total: all.length,
      counts,
      months,
      items: sends.map(({ sentAt }, i) => ({
        sentAt,
        subject: subjects[i],
        digest: digests[i] && {
          top: digests[i].top.map(({ category, heading, line }) => ({
            category,
            heading,
            line,
          })),
          threads: digests[i].threads,
          sections: digests[i].sections.map((s) => ({
            category: s.category,
            newsletterId: s.newsletterId,
            title: s.title,
            stories: s.stories.map((st) => ({
              heading: st.story.heading,
              alsoIn: st.alsoIn,
            })),
          })),
          watch: digests[i].watch,
        },
        starred: markOf.get(sentAt.getTime())?.starred ?? false,
        folderId: markOf.get(sentAt.getTime())?.folderId ?? null,
        newsletters: archives
          .filter((a) => a.sentAt.getTime() === sentAt.getTime())
          .map(({ newsletter: n }) => ({
            id: n.id,
            title: n.title,
            subtitle: n.subtitle,
            image: n.imageUrl?.split(',').find(Boolean) ?? null,
            summary: n.content ? n.content.substring(0, 100) + '...' : null,
            createdAt: n.createdAt,
            category: n.category,
          })),
      })),
    };
  }

  /**
   * 받은 메일 한 통을 받은 그대로 (보낸 시각으로 찾는다). 내 발송 기록에 없으면 404
   */
  async getMail(userId: number, sentAt: Date) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new AppException('USER_NOT_FOUND');
    const [archives, saved] = await Promise.all([
      this.prisma.emailArchive.findMany({
        where: { email: user.email, sentAt },
        select: { newsletterId: true },
      }),
      this.prisma.mailPlan.findUnique({
        where: { email_sentAt: { email: user.email, sentAt } },
        select: { plan: true },
      }),
    ]);
    const mail =
      archives.length &&
      (await this.editionService.rebuildMail(
        sentAt,
        archives.map((a) => a.newsletterId),
        (saved?.plan ?? null) as MailPlan | null,
      ));
    if (!mail)
      throw new AppException('NOT_FOUND', '받은 메일을 찾지 못했어요.');
    return { sentAt, subject: mail.subject, html: mail.html };
  }

  /**
   * 관심사 조회
   * @param userId 사용자 ID
   */
  async getInterests(userId: number) {
    return getInterestIds(this.prisma, userId);
  }

  /**
   * 관심사 수정 (덮어쓰기)
   * @param userId 사용자 ID
   * @param categoryIds 새로운 관심사 목록
   */
  async updateInterests(userId: number, categoryIds: number[]) {
    const ids = await validateCategoryIds(this.prisma, categoryIds);
    await this.prisma.$transaction(
      replaceInterestsOps(this.prisma, userId, ids),
    );
    return { interests: await getInterestIds(this.prisma, userId) };
  }
}
