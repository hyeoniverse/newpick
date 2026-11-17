import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
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

/** 북마크 (#123): 전체 목록(아이콘 · 개수) · 마이페이지 한 쪽 · 폴더 옮기기 */
@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: MysqlPrismaService) {}

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
}
