import { MysqlPrismaService } from '../../prisma/mysql.service';
import { Injectable } from '@nestjs/common';
import { Prisma, Newsletter } from '@prisma/client';
import dayjs from 'dayjs';
import { kstDayRange } from '../common/kst';

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

  /**
   * 최근 자주 나온 키워드(태그) (#20). JSON 배열을 행으로 펴서(JSON_TABLE) 센다.
   * 태그 대부분이 한 번만 나와 '많이 나온 순'이 의미 없어지므로: 두 번 이상 나온 태그를 먼저,
   * 그 안에서는 최근일수록 무겁게 센 점수(1주 지날 때마다 반으로 · 1/(1+일수/7)) 순. 모자라면 한 번 나온 최근 태그로 채운다
   */
  async getPopularKeywords(since: Date, limit: number, categoryId?: number) {
    const category = categoryId
      ? Prisma.sql`AND n.categoryId = ${categoryId}`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<
      Array<{ keyword: string; count: bigint }>
    >`SELECT k.keyword AS keyword, COUNT(*) AS count
      FROM newsletters n,
           JSON_TABLE(n.keywords, '$[*]' COLUMNS (keyword VARCHAR(100) PATH '$')) AS k
      WHERE n.createdAt >= ${since} AND n.keywords IS NOT NULL ${category}
      GROUP BY k.keyword
      ORDER BY (COUNT(*) >= 2) DESC,
               SUM(1 / (1 + TIMESTAMPDIFF(DAY, n.createdAt, NOW()) / 7)) DESC,
               keyword ASC
      LIMIT ${limit}`;
    return rows.map((row) => ({
      keyword: row.keyword,
      count: Number(row.count),
    }));
  }

  /**
   * 태그 전체 (태그 화면 /tags). 태그마다 쓰인 횟수 · 마지막으로 쓰인 날 · 관심사.
   * q가 있으면 이름 일부로 찾기. 많이 쓴 순, 같으면 최근 순 (최대 1000개)
   */
  async getAllKeywords(params: { categoryId?: number; q?: string }) {
    const category = params.categoryId
      ? Prisma.sql`AND n.categoryId = ${params.categoryId}`
      : Prisma.empty;
    const q = params.q
      ? Prisma.sql`AND k.keyword LIKE ${`%${params.q.replace(/[%_\\]/g, '\\$&')}%`}`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<
      Array<{
        keyword: string;
        count: bigint;
        lastUsedAt: Date;
        categoryIds: string | null;
      }>
    >`SELECT k.keyword AS keyword, COUNT(*) AS count, MAX(n.createdAt) AS lastUsedAt,
             GROUP_CONCAT(DISTINCT n.categoryId ORDER BY n.categoryId) AS categoryIds
      FROM newsletters n,
           JSON_TABLE(n.keywords, '$[*]' COLUMNS (keyword VARCHAR(100) PATH '$')) AS k
      WHERE n.keywords IS NOT NULL ${category} ${q}
      GROUP BY k.keyword
      ORDER BY count DESC, lastUsedAt DESC
      LIMIT 1000`;
    return rows.map((row) => ({
      keyword: row.keyword,
      count: Number(row.count),
      lastUsedAt: row.lastUsedAt,
      categoryIds: row.categoryIds
        ? String(row.categoryIds).split(',').map(Number)
        : [],
    }));
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
    const updated = await this.prisma.newsletter.update({
      where: { id },
      data,
    });
    // 본문을 고치면 스크랩에 꺼내 둔 소식 제목을 비워, 다음에 목록을 볼 때 새 본문에서 다시 꺼낸다
    if (data.contentAsHTML !== undefined) {
      await this.prisma.highlight.updateMany({
        where: { newsletterId: id },
        data: { sectionTitle: null },
      });
    }
    return updated;
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
  /**
   * 오늘의 트렌드: 가장 최근 뉴스레터가 나온 날(KST)의 뉴스레터를 분야마다 한 편씩.
   * 예전에는 분야마다 '가장 최근'이라, 오늘 어느 분야가 생성되지 않으면 며칠 전 뉴스레터가 섞여 보였다.
   * 오늘 것이 아직 없으면(아침 생성 전) 어제 것만 보인다
   */
  async getLatestNewslettersForAllCategories(): Promise<Newsletter[]> {
    const latest = await this.prisma.newsletter.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (!latest) return [];
    const { start, end } = kstDayRange(latest.createdAt, latest.createdAt);
    const newsletters = await this.prisma.newsletter.findMany({
      where: { createdAt: { gte: start, lte: end } },
      // 같은 날 다시 만든 분야는 가장 늦게 만든 것으로
      orderBy: [{ categoryId: 'asc' }, { createdAt: 'desc' }],
    });
    const seen = new Set<number>();
    return newsletters.filter(
      (n) => !seen.has(n.categoryId) && !!seen.add(n.categoryId),
    );
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
