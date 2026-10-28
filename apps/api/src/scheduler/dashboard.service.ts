import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { kstDayRange, kstDaysAgo } from 'src/common/kst';
import { AppException } from 'src/common/errors/app.exception';
import { SchedulerService } from './scheduler.service';

/** 대시보드는 요약만: 최근 몇 개. 전체는 상세 목록(페이지)에서 */
const PREVIEW = 5;
/** 고를 수 있는 가장 긴 기간 (일) */
export const MAX_RANGE_DAYS = 92;

/** 긴 글은 앞부분만 (요약 결과 · 오류 메시지) */
const clip = (text: string | null, max: number) =>
  text && text.length > max ? `${text.slice(0, max)}…` : text;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 관리자 대시보드 (#21). 고른 기간(KST 날짜, 기본 오늘)의 수집 · 발행 · AI 기록 · 비용 · 발송,
 * 그리고 지금의 스케줄러 상태 · 마지막 실행 · 구독자 수를 한 번에.
 * 서버에 접속하지 않고 작업이 제대로 돌았는지 본다
 */
/**
 * 표 머리 정렬 (#21): 허용한 열이면 그 열로, 아니면 기본 순서(최신부터).
 * 비어 있을 수 있는 열(비용 · 걸린 시간)은 빈 값을 늘 뒤로. 같은 값끼리는 최신부터
 */
function sortBy(
  q: { sort?: string; order?: 'asc' | 'desc' },
  allowed: readonly string[],
  nullable: readonly string[] = [],
) {
  if (!q.sort || !allowed.includes(q.sort)) return [{ id: 'desc' as const }];
  const order = q.order ?? 'desc';
  return [
    {
      [q.sort]: nullable.includes(q.sort)
        ? { sort: order, nulls: 'last' as const }
        : order,
    },
    { id: 'desc' as const },
  ];
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly scheduler: SchedulerService,
    private readonly prisma: MysqlPrismaService,
    private readonly crawlingRepository: CrawlingRepository,
  ) {}

  /**
   * 그날(KST) 메일을 받은 사람 (#21). 한 사람에게 관심사 여러 개를 한 통으로 보내므로 email로 묶고,
   * 그 메일에 엮은 뉴스레터의 관심사를 함께. 많아도 500명까지
   */
  /** KST 날짜 [from, to] → 시각 범위. 거꾸로거나 너무 길면 거절 */
  private range(from = kstDaysAgo(0), to = from) {
    const { start, end } = kstDayRange(from, to);
    if (start > end) {
      throw new AppException('BAD_REQUEST', '시작 날짜가 끝 날짜보다 늦어요.');
    }
    if ((end.getTime() - start.getTime()) / DAY_MS > MAX_RANGE_DAYS) {
      throw new AppException(
        'BAD_REQUEST',
        `기간은 ${MAX_RANGE_DAYS}일까지 고를 수 있어요.`,
      );
    }
    return { start, end, inRange: { gte: start, lte: end } };
  }

  /**
   * 상세: 수집 기사 (#31). 기간 · 관심사 · 언론사 · 제목, 쪽 단위.
   * 이 쪽의 기사가 어느 뉴스레터에 쓰였는지 원문 링크(newsletters.usedNews, 쉼표로 이은 링크)로 찾아 붙인다
   */
  async listArticles(q: {
    from?: string;
    to?: string;
    categoryId?: number;
    source?: string;
    title?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const { start, end } = this.range(q.from, q.to);
    const category = q.categoryId
      ? (
          await this.prisma.newsCategory.findUnique({
            where: { id: q.categoryId },
            select: { name: true },
          })
        )?.name
      : undefined;
    const { items, total, sources } =
      await this.crawlingRepository.listForAdmin({
        start,
        end,
        category,
        source: q.source,
        title: q.title,
        limit: q.limit ?? 20,
        offset: q.offset ?? 0,
        sortByTitle: q.sort === 'title' ? (q.order ?? 'asc') : undefined,
      });

    const links = items.map((item) => item.link);
    const used = links.length
      ? await this.prisma.$queryRaw<
          Array<{ id: number; title: string; usedNews: string }>
        >`SELECT id, title, usedNews FROM newsletters
          WHERE ${Prisma.join(
            links.map((link) => Prisma.sql`FIND_IN_SET(${link}, usedNews) > 0`),
            ' OR ',
          )}`
      : [];
    return {
      items: items.map((item) => ({
        id: String(item._id),
        title: item.title,
        link: item.link,
        source: item.source,
        category: item.category,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        image: item.images?.[0] ?? null,
        usedIn: used
          .filter((n) => n.usedNews.split(',').includes(item.link))
          .map((n) => ({ id: n.id, title: n.title })),
      })),
      total,
      sources,
    };
  }

  /** 상세: 예약 작업 실행 기록 (최신순, 작업 · 결과로 거르기, 페이지) */
  async listJobRuns(q: {
    from?: string;
    to?: string;
    job?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const { inRange } = this.range(q.from, q.to);
    const where = {
      startedAt: inRange,
      ...(q.job && { job: q.job }),
      ...(q.status && { status: q.status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.jobRun.findMany({
        where,
        orderBy: sortBy(q, ['durationMs'], ['durationMs']),
        skip: q.offset ?? 0,
        take: q.limit ?? 20,
      }),
      this.prisma.jobRun.count({ where }),
    ]);
    return { items, total };
  }

  /** 작업마다 마지막 실행 (DB, 서버를 다시 시작해도 남음) */
  private async lastRuns() {
    const jobs = ['crawling', 'summary', 'mail'] as const;
    const rows = await Promise.all(
      jobs.map((job) =>
        this.prisma.jobRun.findFirst({
          where: { job },
          orderBy: { id: 'desc' },
        }),
      ),
    );
    return Object.fromEntries(jobs.map((job, i) => [job, rows[i]]));
  }

  /** 상세: 기간 안에 발행한 뉴스레터 (최신순, 페이지) */
  async listNewsletters(q: {
    from?: string;
    to?: string;
    categoryId?: number;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const { inRange } = this.range(q.from, q.to);
    const where = {
      createdAt: inRange,
      ...(q.categoryId && { categoryId: q.categoryId }),
    };
    const [items, total] = await Promise.all([
      this.prisma.newsletter.findMany({
        where,
        select: {
          id: true,
          title: true,
          categoryId: true,
          viewcount: true,
          createdAt: true,
        },
        orderBy: sortBy(q, ['title', 'viewcount', 'id']),
        skip: q.offset ?? 0,
        take: q.limit ?? 20,
      }),
      this.prisma.newsletter.count({ where }),
    ]);
    return { items, total };
  }

  /** 상세: 기간 안 발송 기록. 하루에 한 사람 한 줄(받은 관심사 함께), 최신순 · 페이지 */
  async listMails(q: {
    from?: string;
    to?: string;
    email?: string;
    categoryId?: number;
    limit?: number;
    offset?: number;
  }) {
    const { start, end } = this.range(q.from, q.to);
    const email = q.email
      ? Prisma.sql`AND a.email LIKE ${`%${q.email.replace(/[%_\\]/g, '\\$&')}%`}`
      : Prisma.empty;
    // 그 관심사가 담긴 메일만 (한 통은 같은 sentAt). 줄에는 그 메일의 관심사를 모두 보인다
    const category = q.categoryId
      ? Prisma.sql`AND (a.email, a.sentAt) IN (
          SELECT b.email, b.sentAt FROM email_archives b
          JOIN newsletters nb ON nb.id = b.newsletterId
          WHERE nb.categoryId = ${q.categoryId})`
      : Prisma.empty;
    const [rows, counts] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          day: Date | string;
          email: string;
          sentAt: Date;
          categoryIds: string | null;
        }>
      >`SELECT DATE(CONVERT_TZ(a.sentAt, '+00:00', '+09:00')) AS day, a.email AS email,
               MIN(a.sentAt) AS sentAt,
               GROUP_CONCAT(DISTINCT n.categoryId ORDER BY n.categoryId) AS categoryIds
        FROM email_archives a
        LEFT JOIN newsletters n ON n.id = a.newsletterId
        WHERE a.sentAt >= ${start} AND a.sentAt <= ${end} ${email} ${category}
        GROUP BY day, a.email
        ORDER BY day DESC, sentAt ASC, a.email ASC
        LIMIT ${q.limit ?? 20} OFFSET ${q.offset ?? 0}`,
      this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COUNT(*) AS total FROM (
          SELECT 1 FROM email_archives a
          WHERE a.sentAt >= ${start} AND a.sentAt <= ${end} ${email} ${category}
          GROUP BY DATE(CONVERT_TZ(a.sentAt, '+00:00', '+09:00')), a.email
        ) t`,
    ]);
    return {
      items: rows.map((row) => ({
        day:
          row.day instanceof Date
            ? row.day.toISOString().slice(0, 10)
            : String(row.day).slice(0, 10),
        email: row.email,
        sentAt: row.sentAt,
        categoryIds: row.categoryIds
          ? String(row.categoryIds).split(',').map(Number)
          : [],
      })),
      total: Number(counts[0]?.total ?? 0),
    };
  }

  /** 상세: 기간 안 AI 기록 (최신순, 종류 · 결과로 거르기, 페이지) + 그 조건의 비용 합계 */
  async listAiLogs(q: {
    from?: string;
    to?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const { inRange } = this.range(q.from, q.to);
    const where = {
      createdAt: inRange,
      ...(q.type && { processType: q.type }),
      ...(q.status && { status: q.status }),
    };
    const [items, total, cost] = await Promise.all([
      this.prisma.aiProcessLog.findMany({
        where,
        orderBy: sortBy(q, ['duration', 'token', 'costUsd'], ['costUsd']),
        skip: q.offset ?? 0,
        take: q.limit ?? 20,
        select: {
          id: true,
          processType: true,
          status: true,
          duration: true,
          token: true,
          createdAt: true,
          result: true,
          error: true,
          model: true,
          inputTokens: true,
          outputTokens: true,
          costUsd: true,
        },
      }),
      this.prisma.aiProcessLog.count({ where }),
      this.prisma.aiProcessLog.aggregate({
        where,
        _sum: { costUsd: true },
        _count: { costUsd: true },
      }),
    ]);
    return {
      items: items.map((log) => ({
        ...log,
        result: clip(log.result, 400),
        error: clip(log.error, 600),
      })),
      total,
      cost: {
        total: cost._sum.costUsd ?? 0,
        unknown: total - cost._count.costUsd,
      },
    };
  }

  async getMailRecipients(date: string) {
    const { start, end } = kstDayRange(date, date);
    const rows = await this.prisma.$queryRaw<
      Array<{ email: string; sentAt: Date; categoryIds: string | null }>
    >`SELECT a.email AS email, MIN(a.sentAt) AS sentAt,
             GROUP_CONCAT(DISTINCT n.categoryId ORDER BY n.categoryId) AS categoryIds
      FROM email_archives a
      LEFT JOIN newsletters n ON n.id = a.newsletterId
      WHERE a.sentAt >= ${start} AND a.sentAt <= ${end}
      GROUP BY a.email
      ORDER BY sentAt ASC, email ASC
      LIMIT 500`;
    return rows.map((row) => ({
      email: row.email,
      sentAt: row.sentAt,
      categoryIds: row.categoryIds
        ? String(row.categoryIds).split(',').map(Number)
        : [],
    }));
  }

  async getDashboard(from = kstDaysAgo(0), to = from) {
    const { start, end, inRange } = this.range(from, to);

    const [
      crawled,
      latestCrawled,
      newsletters,
      newsletterCount,
      logs,
      logCount,
      mailByDay,
      activeSubscribers,
      cost,
      lastRuns,
    ] = await Promise.all([
      this.crawlingRepository.countBetween(start, end),
      this.crawlingRepository.getLatestCrawledNews(),
      this.prisma.newsletter.findMany({
        where: { createdAt: inRange },
        select: { id: true, title: true, categoryId: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }, { categoryId: 'asc' }],
        take: PREVIEW,
      }),
      this.prisma.newsletter.count({ where: { createdAt: inRange } }),
      this.prisma.aiProcessLog.findMany({
        where: { createdAt: inRange },
        orderBy: { id: 'desc' },
        take: PREVIEW,
        select: {
          id: true,
          processType: true,
          status: true,
          duration: true,
          token: true,
          createdAt: true,
          result: true,
          error: true,
          model: true,
          inputTokens: true,
          outputTokens: true,
          costUsd: true,
        },
      }),
      this.prisma.aiProcessLog.count({ where: { createdAt: inRange } }),
      // KST 날짜별 받은 사람 수 (한 사람에게 관심사 여러 개를 한 통으로 보내므로 email로 센다)
      this.prisma.$queryRaw<Array<{ day: Date | string; recipients: bigint }>>`
        SELECT DATE(CONVERT_TZ(sentAt, '+00:00', '+09:00')) AS day, COUNT(DISTINCT email) AS recipients
        FROM email_archives
        WHERE sentAt >= ${start} AND sentAt <= ${end}
        GROUP BY day
        ORDER BY day DESC`,
      this.prisma.subscriber.count({ where: { status: 'active' } }),
      // Claude 비용 합계 (비용을 모르는 이전 기록은 빠지고, 몇 건인지 따로 센다)
      this.prisma.aiProcessLog.aggregate({
        where: { createdAt: inRange },
        _sum: { costUsd: true },
        _count: { costUsd: true },
      }),
      this.lastRuns(),
    ]);

    const status = this.scheduler.getSchedulerStatus();
    return {
      range: { from, to },
      scheduler: {
        // false면 이 서버는 예약 시각에 저절로 돌지 않는다 (SCHEDULER_ENABLED=false, 보통 로컬)
        autoRun: status.autoRun,
        enabled: {
          crawling: status.crawling,
          summary: status.aiSummary,
          mail: status.mailing,
        },
        schedule: this.scheduler.getSchedule(),
        // 지금 진행 중이면 서버 메모리, 아니면 DB의 마지막 실행 (재시작해도 남음)
        runs: Object.fromEntries(
          (['crawling', 'summary', 'mail'] as const).map((job) => {
            const live = status.runs[job];
            const last = lastRuns[job];
            if (live.running || !last) return [job, live];
            return [
              job,
              {
                running: last.status === 'running',
                trigger: last.trigger,
                startedAt: last.startedAt.toISOString(),
                finishedAt: last.finishedAt?.toISOString() ?? null,
                status: last.status === 'running' ? null : last.status,
                message: last.message,
              },
            ];
          }),
        ),
      },
      crawling: {
        count: crawled,
        latestAt: latestCrawled?.createdAt ?? null,
      },
      newsletters: { total: newsletterCount, items: newsletters },
      aiCost: {
        total: cost._sum.costUsd ?? 0,
        // 비용을 알 수 없는(이전) 기록 수
        unknown: logCount - cost._count.costUsd,
      },
      summaryLogs: {
        total: logCount,
        items: logs.map((log) => ({
          ...log,
          result: clip(log.result, 160),
          error: clip(log.error, 300),
        })),
      },
      mail: {
        activeSubscribers,
        byDay: mailByDay.map((row) => ({
          day:
            row.day instanceof Date
              ? row.day.toISOString().slice(0, 10)
              : String(row.day).slice(0, 10),
          recipients: Number(row.recipients),
        })),
      },
    };
  }
}
