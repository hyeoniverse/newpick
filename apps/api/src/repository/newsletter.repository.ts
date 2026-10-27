import { MysqlPrismaService } from '../../prisma/mysql.service';
import { Injectable } from '@nestjs/common';
import { Prisma, Newsletter } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class NewsletterRepo {
  constructor(private readonly prisma: MysqlPrismaService) {}

  async getNewsletterList(
    offset: number,
    limit: number,
    startDate: Date | null,
    endDate: Date | null,
    trend?: boolean | null,
    categoryId?: number | null,
  ) {
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate(),
      };
    }

    const result = await this.prisma.newsletter.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        subtitle: true,
        keywords: true,
        imageUrl: true,
        categoryId: true,
        viewcount: true,
        createdAt: true,
        content: true,
      },
      skip: offset,
      take: limit,
      ...(trend && { orderBy: { viewcount: trend ? 'desc' : 'asc' } }),
      ...(categoryId && { where: { categoryId } }),
    });

    return result;
  }

  async getNewsletter(
    offset: number,
    limit: number,
    trend?: boolean | null,
    categoryId?: number | null,
  ) {
    if (trend) {
      const orderBy = trend ? 'desc' : 'asc';
      return this.prisma.newsletter.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          viewcount: orderBy,
        },
        ...(categoryId && { where: { categoryId } }),
      });
    } else {
      return this.prisma.newsletter.findMany({
        skip: offset,
        take: limit,
        ...(categoryId && { where: { categoryId } }),
      });
    }
  }

  /**
   * 지난 뉴스레터 검색 (#20). 조건을 모두 만족하는 것만, 페이지와 전체 건수를 함께 돌려준다.
   * 검색어는 FULLTEXT(ngram) 불린 모드, 키워드는 JSON 배열에 정확히 같은 값, 기간은 KST 날짜 경계
   */
  async searchNewsletters(params: {
    booleanQuery: string | null;
    keyword?: string;
    categoryId?: number;
    from?: Date;
    to?: Date;
    sort: 'latest' | 'popular';
    limit: number;
    offset: number;
  }) {
    const conditions: Prisma.Sql[] = [];
    if (params.booleanQuery) {
      conditions.push(
        Prisma.sql`MATCH(title, subtitle, content) AGAINST (${params.booleanQuery} IN BOOLEAN MODE)`,
      );
    }
    if (params.keyword) {
      conditions.push(
        Prisma.sql`JSON_CONTAINS(keywords, JSON_QUOTE(${params.keyword}))`,
      );
    }
    if (params.categoryId) {
      conditions.push(Prisma.sql`categoryId = ${params.categoryId}`);
    }
    if (params.from) conditions.push(Prisma.sql`createdAt >= ${params.from}`);
    if (params.to) conditions.push(Prisma.sql`createdAt <= ${params.to}`);

    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;
    const orderBy =
      params.sort === 'popular'
        ? Prisma.sql`ORDER BY viewcount DESC, createdAt DESC, id DESC`
        : Prisma.sql`ORDER BY createdAt DESC, id DESC`;

    const [items, counts] = await Promise.all([
      // 목록 카드에는 본문 앞부분만 쓰므로 400자만 (LongText 전체를 보내지 않음)
      this.prisma.$queryRaw<
        Array<Omit<Newsletter, 'contentAsHTML' | 'usedNews'>>
      >`SELECT id, title, subtitle, keywords, imageUrl, categoryId, viewcount, createdAt,
               LEFT(content, 400) AS content
        FROM newsletters ${where} ${orderBy}
        LIMIT ${params.limit} OFFSET ${params.offset}`,
      this.prisma.$queryRaw<
        Array<{ total: bigint }>
      >`SELECT COUNT(*) AS total FROM newsletters ${where}`,
    ]);

    return { items, total: Number(counts[0]?.total ?? 0) };
  }

  async getNewsletterById(id: number) {
    return this.prisma.newsletter.findUnique({
      where: { id },
    });
  }

  async getNewsletterByCategoryId(
    categoryId: number,
    offset: number,
    limit: number,
  ) {
    return this.prisma.newsletter.findMany({
      where: { categoryId },
      skip: offset,
      take: limit,
    });
  }

  async getPreviousNewsletter(newsletterId: number, dateStart: Date) {
    return this.prisma.newsletter.findFirst({
      where: { id: { lt: newsletterId }, createdAt: { lt: dateStart } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNextNewsletter(newsletterId: number, dateStart: Date) {
    return this.prisma.newsletter.findFirst({
      where: { id: { gt: newsletterId }, createdAt: { gt: dateStart } },
      orderBy: { createdAt: 'asc' },
    });
  }
  async getNewsletterByDateRange(dateStart: Date, dateEnd: Date) {
    return this.prisma.newsletter.findMany({
      where: { createdAt: { gte: dateStart, lte: dateEnd } },
    });
  }

  async getNewsletterByCategoryIdAndDate(
    dateStart: Date,
    dateEnd: Date,
    categoryId?: number,
  ): Promise<Newsletter[]> {
    if (categoryId) {
      return this.prisma.newsletter.findMany({
        where: {
          categoryId,
          createdAt: { gte: dateStart, lte: dateEnd },
        },
      });
    } else {
      return this.prisma.newsletter.findMany({
        where: { createdAt: { gte: dateStart, lte: dateEnd } },
      });
    }
  }

  async deleteNewsletter(id: number) {
    return this.prisma.newsletter.delete({
      where: { id },
    });
  }

  async updateNewsletter(id: number, data: Prisma.NewsletterUpdateInput) {
    return this.prisma.newsletter.update({
      where: { id },
      data,
    });
  }

  /**
   * 어제의 시작/종료 시간을 계산하는 헬퍼 메서드
   */
  private getYesterdayRange(): { start: Date; end: Date } {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const start = new Date(yesterday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * 특정 카테고리에 대해 어제 작성된 뉴스레터 중 가장 최근의 하나를 조회
   */
  async getNewsletterFromYesterdayByCategory(
    categoryId: number,
  ): Promise<Newsletter | null> {
    const { start, end } = this.getYesterdayRange();
    return this.prisma.newsletter.findFirst({
      where: {
        categoryId,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 모든 카테고리에 대해 어제 작성된 뉴스레터가 존재하는 카테고리별로
   * 가장 최근의 뉴스레터 한 건씩 조회
   */
  async getNewslettersFromYesterdayForAllCategories() {
    const { start, end } = this.getYesterdayRange();

    // 어제 생성된 뉴스레터가 있는 각 카테고리의 목록을 distinct 하게 조회
    const categories = await this.prisma.newsletter.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { categoryId: true },
      distinct: ['categoryId'],
    });

    const newsletters: Newsletter[] = [];
    // 각 카테고리별로 가장 최근의 뉴스레터 한 건씩 조회
    for (const { categoryId } of categories) {
      const newsletter =
        await this.getNewsletterFromYesterdayByCategory(categoryId);
      if (newsletter) {
        newsletters.push(newsletter);
      }
    }
    return newsletters;
  }

  async getRandomNewsletters(
    dateStart: Date,
    dateEnd: Date,
    num: number,
  ): Promise<Newsletter[]> {
    return this.prisma.newsletter.findMany({
      where: {
        createdAt: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      take: Number(num),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  /**
   * 모든 카테고리에 대해 가장 최신의 뉴스레터 한 건씩 조회
   */
  async getLatestNewslettersForAllCategories(): Promise<Newsletter[]> {
    // 각 카테고리별로 가장 최신의 뉴스레터를 가져오기 위해 distinct 조회
    const categories = await this.prisma.newsletter.findMany({
      select: { categoryId: true },
      distinct: ['categoryId'],
    });

    const newsletters: Newsletter[] = [];
    // 각 카테고리별로 가장 최신 뉴스레터 조회
    for (const { categoryId } of categories) {
      const newsletter = await this.prisma.newsletter.findFirst({
        where: { categoryId },
        orderBy: { createdAt: 'desc' },
      });
      if (newsletter) {
        newsletters.push(newsletter);
      }
    }
    return newsletters;
  }

  async addViewcount(id: number) {
    id = Number(id);
    return this.prisma.newsletter.update({
      where: { id },
      data: { viewcount: { increment: 1 } },
    });
  }
  async resetViewcount(id: number) {
    id = Number(id);
    return this.prisma.newsletter.update({
      where: { id },
      data: { viewcount: 0 },
    });
  }
}
