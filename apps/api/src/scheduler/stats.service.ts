import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { kstDays, kstDaysAgo, kstMonth, toKstDate } from 'src/common/kst';
import { kstRange } from './dashboard.service';

/** 기간을 안 주면 최근 30일 (추이를 보는 화면이라 하루로는 모자라서) */
const DEFAULT_DAYS = 30;

/** 비용은 소수 여섯째 자리까지 (pricing.ts와 같음) */
const round = (usd: number) => Math.round(usd * 1_000_000) / 1_000_000;

/** AI 기록 한 줄의 호출별 사용량 (ai_process_logs.calls) */
type Call = {
  stage: string | null;
  model: string;
  input: number;
  output: number;
  costUsd: number | null;
};

/** 모델 · 단계를 나눌 수 없는 이전 기록 (한 줄에 두 모델이 섞여 합계만 있음) */
export const MIXED = 'mixed';

/** 키별 합계를 [{ key, value }] 큰 순서로 */
const ranked = (map: Map<string, number>) =>
  [...map.entries()]
    .map(([key, cost]) => ({ key, cost: round(cost) }))
    .sort((a, b) => b.cost - a.cost);

const add = (map: Map<string, number>, key: string, value: number) =>
  map.set(key, (map.get(key) ?? 0) + value);

/**
 * 관리자 통계 (#122): 구독자 · AI 비용 · 발송 · 읽기의 날짜별 추이. 날짜는 KST 하루 단위.
 * 대시보드(#21)는 고른 기간의 합계만, 여기는 늘고 주는 흐름과 비용이 어디서 나가는지
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  private period(from?: string, to?: string) {
    const end = to ?? (from ? from : kstDaysAgo(0));
    const start = from ?? kstDaysAgo(DEFAULT_DAYS - 1);
    return {
      from: start,
      to: end,
      ...kstRange(start, end),
      days: kstDays(start, end),
    };
  }

  /**
   * 구독자: 날짜별 새 구독 · 다시 시작 · 일시정지 · 해지와 그날 끝의 구독 중 수, 관심사별 지금 구독 중.
   * 구독 기록(subscription_events)을 처음부터 다시 따라가 사람마다 상태를 맞춘다 (기록이 회원당 몇 줄이라 가볍다)
   */
  async subscribers(from?: string, to?: string) {
    const { days, end, ...range } = this.period(from, to);
    const [events, first, categories, byCategory, active] = await Promise.all([
      this.prisma.subscriptionEvent.findMany({
        where: { at: { lte: end } },
        orderBy: [{ at: 'asc' }, { id: 'asc' }],
        select: { userId: true, type: true, at: true },
      }),
      this.prisma.subscriptionEvent.aggregate({ _min: { createdAt: true } }),
      this.prisma.newsCategory.findMany({
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.userInterest.groupBy({
        by: ['categoryId'],
        where: { user: { subscribers: { some: { status: 'active' } } } },
        _count: { _all: true },
      }),
      this.prisma.subscriber.count({ where: { status: 'active' } }),
    ]);

    const state = new Map<number, boolean>();
    let activeNow = 0;
    const apply = (userId: number, type: string) => {
      const before = state.get(userId) ?? false;
      const after = type === 'subscribe' || type === 'resume';
      state.set(userId, after);
      activeNow += Number(after) - Number(before);
    };

    const byDay = new Map(
      days.map((date) => [
        date,
        { date, subscribe: 0, resume: 0, pause: 0, cancel: 0, active: 0 },
      ]),
    );
    let i = 0;
    for (; i < events.length && events[i].at < range.start; i++)
      apply(events[i].userId, events[i].type);
    const activeStart = activeNow;
    for (const date of days) {
      const row = byDay.get(date)!;
      for (; i < events.length && toKstDate(events[i].at) === date; i++) {
        const { userId, type } = events[i];
        if (type in row)
          row[type as 'subscribe' | 'resume' | 'pause' | 'cancel'] += 1;
        apply(userId, type);
      }
      row.active = activeNow;
    }

    const rows = [...byDay.values()];
    const sum = (key: 'subscribe' | 'resume' | 'pause' | 'cancel') =>
      rows.reduce((n, r) => n + r[key], 0);
    const counts = new Map(
      byCategory.map((row) => [row.categoryId, row._count._all]),
    );
    return {
      range: { from: range.from, to: range.to },
      // 기록을 쌓기 시작한 날. 그 전 날짜는 지금 구독 상태로 채운 추정
      since: first._min.createdAt ? toKstDate(first._min.createdAt) : null,
      days: rows,
      totals: {
        subscribe: sum('subscribe'),
        resume: sum('resume'),
        pause: sum('pause'),
        cancel: sum('cancel'),
        activeStart,
        activeEnd: activeNow,
      },
      active,
      byCategory: categories.map((c) => ({
        id: c.id,
        name: c.name,
        active: counts.get(c.id) ?? 0,
      })),
    };
  }

  /**
   * AI 비용: 날짜별 · 종류별 · 관심사별 · 모델별 · 단계별, 뉴스레터 한 편당 평균, 이번 달 누적 · 월말 예상.
   * 비용을 모르는 기록(가격표에 없는 모델 · 이전 기록)은 합계에서 빼고 따로 센다. 실패 기록은 사용량이 남지 않아 따로 센다
   */
  async cost(from?: string, to?: string) {
    const { days, inRange, start, end, ...range } = this.period(from, to);
    const month = kstMonth();
    const [logs, newsletters, monthCost, categories] = await Promise.all([
      this.prisma.aiProcessLog.findMany({
        where: { createdAt: inRange },
        select: {
          createdAt: true,
          processType: true,
          status: true,
          newsId: true,
          model: true,
          costUsd: true,
          calls: true,
        },
      }),
      // 요약 기록 ↔ 뉴스레터는 쓴 기사 링크(usedNews)가 같다. 기록 직후에 저장하므로 끝에 1시간 여유
      this.prisma.newsletter.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: new Date(end.getTime() + 60 * 60 * 1000),
          },
        },
        select: { usedNews: true, categoryId: true, createdAt: true },
      }),
      this.prisma.aiProcessLog.aggregate({
        where: { createdAt: { gte: month.start } },
        _sum: { costUsd: true },
      }),
      this.prisma.newsCategory.findMany({
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      }),
    ]);

    const categoryOf = new Map(
      newsletters.map((n) => [n.usedNews, n.categoryId]),
    );
    const byDay = new Map(
      days.map((date) => [
        date,
        { date, cost: 0, byType: {} as Record<string, number> },
      ]),
    );
    const byType = new Map<
      string,
      { cost: number; count: number; unknown: number; failed: number }
    >();
    const byModel = new Map<string, number>();
    const byStage = new Map<string, number>();
    const byCategory = new Map<number | null, number>();
    let total = 0;
    let unknown = 0;
    let failed = 0;

    for (const log of logs) {
      const type = byType.get(log.processType) ?? {
        cost: 0,
        count: 0,
        unknown: 0,
        failed: 0,
      };
      byType.set(log.processType, type);
      type.count += 1;
      if (log.status !== 'success') {
        type.failed += 1;
        failed += 1;
        continue;
      }
      if (log.costUsd === null) {
        type.unknown += 1;
        unknown += 1;
        continue;
      }
      const cost = log.costUsd;
      total += cost;
      type.cost += cost;
      const day = byDay.get(toKstDate(log.createdAt));
      if (day) {
        day.cost += cost;
        day.byType[log.processType] = (day.byType[log.processType] ?? 0) + cost;
      }
      // 관심사: 뉴스레터 쓰기만 한 관심사에 속한다. 분류 · 하루 편집은 전 분야 공통(null)
      const categoryId =
        log.processType === 'summarization'
          ? (categoryOf.get(log.newsId) ?? null)
          : null;
      byCategory.set(categoryId, (byCategory.get(categoryId) ?? 0) + cost);

      const calls = (log.calls as Call[] | null) ?? null;
      if (calls?.length) {
        for (const call of calls) {
          if (call.costUsd === null) continue;
          add(byModel, call.model, call.costUsd);
          add(byStage, call.stage ?? log.processType, call.costUsd);
        }
      } else if (log.model && !log.model.includes(',')) {
        // 이전 기록이라도 모델이 하나면 나눌 수 있다
        add(byModel, log.model, cost);
        add(
          byStage,
          log.processType === 'summarization' ? MIXED : log.processType,
          cost,
        );
      } else {
        add(byModel, MIXED, cost);
        add(byStage, MIXED, cost);
      }
    }

    const published = newsletters.filter((n) => n.createdAt <= end).length;
    const monthToDate = monthCost._sum.costUsd ?? 0;
    const names = new Map(categories.map((c) => [c.id, c.name]));
    return {
      range: { from: range.from, to: range.to },
      total: round(total),
      count: logs.length,
      unknown,
      failed,
      newsletters: published,
      perNewsletter: published ? round(total / published) : null,
      days: [...byDay.values()].map((d) => ({
        date: d.date,
        cost: round(d.cost),
        byType: Object.fromEntries(
          Object.entries(d.byType).map(([k, v]) => [k, round(v)]),
        ),
      })),
      byType: [...byType.entries()]
        .map(([key, t]) => ({ key, ...t, cost: round(t.cost) }))
        .sort((a, b) => b.cost - a.cost),
      byModel: ranked(byModel),
      byStage: ranked(byStage),
      byCategory: [...byCategory.entries()]
        .map(([id, cost]) => ({
          id,
          name: id === null ? null : (names.get(id) ?? String(id)),
          cost: round(cost),
        }))
        .sort((a, b) => b.cost - a.cost),
      // 이번 달(KST) 누적과, 지금까지의 하루 평균으로 늘린 월말 예상 (고른 기간과 상관없이)
      month: {
        month: month.month,
        toDate: round(monthToDate),
        projected: round((monthToDate / month.elapsedDays) * month.daysInMonth),
        elapsedDays: month.elapsedDays,
        daysInMonth: month.daysInMonth,
      },
    };
  }

  /**
   * 발송 · 읽기: 날짜별 받은 사람 · 보낸 메일 수, 구독 메일 작업 결과(성공 · 일부 실패 · 실패 · 건너뜀),
   * 기간 안에 나온 뉴스레터의 관심사별 조회수와 많이 본 뉴스레터
   */
  async delivery(from?: string, to?: string) {
    const { days, inRange, start, end, ...range } = this.period(from, to);
    const [sent, runs, newsletters, categories] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ day: Date | string; recipients: bigint; mails: bigint }>
      >`
        SELECT DATE(CONVERT_TZ(sentAt, '+00:00', '+09:00')) AS day,
               COUNT(DISTINCT email) AS recipients, COUNT(*) AS mails
        FROM email_archives
        WHERE sentAt >= ${start} AND sentAt <= ${end}
        GROUP BY day`,
      this.prisma.jobRun.findMany({
        where: { job: 'mail', startedAt: inRange },
        select: { status: true, startedAt: true },
      }),
      this.prisma.newsletter.findMany({
        where: { createdAt: inRange },
        select: {
          id: true,
          title: true,
          categoryId: true,
          viewcount: true,
          createdAt: true,
        },
      }),
      this.prisma.newsCategory.findMany({
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      }),
    ]);

    const byDay = new Map(
      days.map((date) => [
        date,
        {
          date,
          recipients: 0,
          mails: 0,
          runs: { success: 0, partial: 0, failed: 0, skipped: 0 },
        },
      ]),
    );
    for (const row of sent) {
      const date =
        row.day instanceof Date
          ? row.day.toISOString().slice(0, 10)
          : String(row.day).slice(0, 10);
      const day = byDay.get(date);
      if (!day) continue;
      day.recipients = Number(row.recipients);
      day.mails = Number(row.mails);
    }
    for (const run of runs) {
      const day = byDay.get(toKstDate(run.startedAt));
      if (day && run.status in day.runs)
        day.runs[run.status as keyof typeof day.runs] += 1;
    }

    const rows = [...byDay.values()];
    const views = new Map<number, { views: number; newsletters: number }>();
    for (const n of newsletters) {
      const v = views.get(n.categoryId) ?? { views: 0, newsletters: 0 };
      v.views += n.viewcount;
      v.newsletters += 1;
      views.set(n.categoryId, v);
    }
    const names = new Map(categories.map((c) => [c.id, c.name]));
    return {
      range: { from: range.from, to: range.to },
      days: rows,
      totals: {
        recipients: rows.reduce((n, r) => n + r.recipients, 0),
        mails: rows.reduce((n, r) => n + r.mails, 0),
        runs: {
          success: rows.reduce((n, r) => n + r.runs.success, 0),
          partial: rows.reduce((n, r) => n + r.runs.partial, 0),
          failed: rows.reduce((n, r) => n + r.runs.failed, 0),
          skipped: rows.reduce((n, r) => n + r.runs.skipped, 0),
        },
      },
      views: {
        total: newsletters.reduce((n, x) => n + x.viewcount, 0),
        byCategory: categories.map((c) => ({
          id: c.id,
          name: c.name,
          ...(views.get(c.id) ?? { views: 0, newsletters: 0 }),
        })),
        top: [...newsletters]
          .sort((a, b) => b.viewcount - a.viewcount || b.id - a.id)
          .slice(0, 5)
          .map((n) => ({ ...n, category: names.get(n.categoryId) ?? null })),
      },
    };
  }
}
