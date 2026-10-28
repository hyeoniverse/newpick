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
      include: {
        newsletter: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            content: true,
            createdAt: true,
            viewcount: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 폴더 · 정렬(북마크한 순 · 발행일 · 조회수)은 화면에서 (목록이 길지 않아 한 번에 받는다)
    return bookmarks.map(({ newsletter, createdAt, folderId }) => ({
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
    }));
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
    if (!sends.length) return { items: [], total: all.length, counts };

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

    // 받은편지함처럼 메일 제목도 (발송 때와 같은 방식으로 다시 만든다, AI 호출 없음)
    const subjects = await Promise.all(
      sends.map(({ sentAt }) =>
        this.editionService
          .rebuildMail(
            sentAt,
            archives
              .filter((a) => a.sentAt.getTime() === sentAt.getTime())
              .map((a) => a.newsletter.id),
          )
          .then((mail) => mail?.subject ?? null),
      ),
    );

    return {
      total: all.length,
      counts,
      items: sends.map(({ sentAt }, i) => ({
        sentAt,
        subject: subjects[i],
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
    const archives = await this.prisma.emailArchive.findMany({
      where: { email: user.email, sentAt },
      select: { newsletterId: true },
    });
    const mail =
      archives.length &&
      (await this.editionService.rebuildMail(
        sentAt,
        archives.map((a) => a.newsletterId),
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
