import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { kstDayRange, kstDaysAgo } from 'src/common/kst';
import { SchedulerService } from './scheduler.service';

/** 최근 기록을 몇 개까지 보여 줄지 */
const RECENT_LOGS = 20;
const MAIL_DAYS = 7;

/** 긴 글은 앞부분만 (요약 결과 · 오류 메시지) */
const clip = (text: string | null, max: number) =>
  text && text.length > max ? `${text.slice(0, max)}…` : text;

/**
 * 관리자 대시보드 (#21). 스케줄러 상태 · 마지막 실행, 오늘 수집 · 발행, 최근 AI 요약 기록, 최근 7일 발송을 한 번에.
 * 서버에 접속하지 않고 오늘 아침 작업이 제대로 돌았는지 본다
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly scheduler: SchedulerService,
    private readonly prisma: MysqlPrismaService,
    private readonly crawlingRepository: CrawlingRepository,
  ) {}

  async getDashboard() {
    const today = kstDaysAgo(0);
    const { start: todayStart } = kstDayRange(today, today);
    const { start: mailFrom } = kstDayRange(
      kstDaysAgo(MAIL_DAYS - 1),
      kstDaysAgo(MAIL_DAYS - 1),
    );

    const [
      config,
      crawledToday,
      latestCrawled,
      newslettersToday,
      logs,
      mailByDay,
      activeSubscribers,
    ] = await Promise.all([
      this.prisma.scheduleConfig.findUnique({ where: { id: 1 } }),
      this.crawlingRepository.countSince(todayStart),
      this.crawlingRepository.getLatestCrawledNews(),
      this.prisma.newsletter.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { id: true, title: true, categoryId: true, createdAt: true },
        orderBy: { categoryId: 'asc' },
      }),
      this.prisma.aiProcessLog.findMany({
        orderBy: { id: 'desc' },
        take: RECENT_LOGS,
        select: {
          id: true,
          processType: true,
          status: true,
          duration: true,
          token: true,
          createdAt: true,
          result: true,
          error: true,
        },
      }),
      // KST 날짜별 받은 사람 수 (한 사람에게 관심사 여러 개를 한 통으로 보내므로 email로 센다)
      this.prisma.$queryRaw<Array<{ day: Date | string; recipients: bigint }>>`
        SELECT DATE(CONVERT_TZ(sentAt, '+00:00', '+09:00')) AS day, COUNT(DISTINCT email) AS recipients
        FROM email_archives
        WHERE sentAt >= ${mailFrom}
        GROUP BY day
        ORDER BY day DESC`,
      this.prisma.subscriber.count({ where: { status: 'active' } }),
    ]);

    const status = this.scheduler.getSchedulerStatus();
    return {
      today,
      scheduler: {
        enabled: {
          crawling: status.crawling,
          summary: status.aiSummary,
          mail: status.mailing,
        },
        // 메일: hour시 40분, day 0(일)~6(토) · 7(매일). 저장한 적이 없으면 매일 8:40
        mailSchedule: { hour: config?.hour ?? 8, day: config?.day ?? 7 },
        runs: status.runs,
      },
      crawling: {
        today: crawledToday,
        latestAt: latestCrawled?.createdAt ?? null,
      },
      newsletters: newslettersToday,
      summaryLogs: logs.map((log) => ({
        ...log,
        result: clip(log.result, 160),
        error: clip(log.error, 300),
      })),
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
