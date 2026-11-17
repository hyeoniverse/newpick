import { JobRunsService } from '../job-runs.service';
import { MailJobService } from '../mail-job.service';
import { ScheduleConfigService } from '../schedule-config.service';
import { SchedulerService } from '../scheduler.service';
import { SummaryJobService } from '../summary-job.service';

/** 예약 작업 테스트 공통: 서비스 다섯 개를 목(mock)으로 조립한다 (#199에서 scheduler.service를 나눔) */
export function setup(failingCategoryId: number, edition: unknown = null) {
  const categories = [
    { id: 1, name: 'IT' },
    { id: 2, name: '정치' },
    { id: 3, name: '경제' },
  ];
  const crawlingRepository = {
    getCrawledNewsBetween: jest.fn(async (_s, _e, categoryId: number) => {
      if (categoryId === failingCategoryId) throw new Error('Mongo timeout');
      return [{ title: `뉴스${categoryId}` }];
    }),
  };
  const aiSummaryService = {
    summarizeText: jest.fn(async (_news, categoryId: number) => ({
      // 실제처럼 만든 뉴스레터 한 편 (예전 목은 배열이라 '늘 0편' 버그를 못 잡았다)
      newsletter: { categoryId, content: `요약${categoryId}` },
    })),
  };
  const editionService = {
    ensureEdition: jest.fn().mockResolvedValue(edition),
    composeMail: jest.fn((_e, interests: number[]) => ({
      subject: `분야 ${interests.join(',')}`,
      html: '',
      newsletterIds: interests,
    })),
    writeNote: jest.fn().mockResolvedValue({
      subject: '맞춤 제목',
      briefing: '맞춤 브리핑',
    }),
    embedForPlans: jest.fn().mockResolvedValue(new Map()),
  };
  const tasteService = {
    profiles: jest.fn().mockResolvedValue(new Map()),
    signalTexts: jest.fn().mockResolvedValue(new Map()),
    tagFollows: jest.fn().mockResolvedValue(new Map()),
  };
  const followsService = {
    detect: jest.fn().mockResolvedValue({}),
    forMail: jest.fn().mockResolvedValue(new Map()),
  };
  const recommendService = {
    forUsers: jest.fn().mockResolvedValue(new Map()),
    forTags: jest.fn().mockResolvedValue(new Map()),
  };
  const mailService = {
    sendHtmlMail: jest.fn(),
    sendBulkMail: jest.fn(async (subscribers, build) => {
      subscribers.forEach(build);
      return { success: subscribers.length, failed: 0, skipped: 0 };
    }),
  };
  const subscriberService = {
    getSubscribers: jest.fn().mockResolvedValue([
      { email: 'a@example.com', interests: [1, 3], name: 'a', userId: 7 },
      { email: 'b@example.com', interests: [], name: 'b', userId: 8 },
    ]),
  };
  const siteCache = { refresh: jest.fn().mockResolvedValue({ ok: true }) };
  const cronJob = { setTime: jest.fn(), start: jest.fn() };
  const registry = { getCronJob: jest.fn().mockReturnValue(cronJob) };
  const prisma = {
    scheduleConfig: { upsert: jest.fn().mockResolvedValue({}) },
    // 맞춤 메일 설정: 기본은 모두 켜짐 (끈 사람은 optedOut에)
    optedOut: new Set<number>(),
    user: {
      findMany: jest.fn(async (args: { where: { id: { in: number[] } } }) =>
        args.where.id.in
          .filter((id) => !prisma.optedOut.has(id))
          .map((id) => ({ id })),
      ),
    },
    // 그날 이미 있는 뉴스레터 (기본 없음)
    newsletter: { findMany: jest.fn().mockResolvedValue([]) },
    jobRun: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 41 }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const scheduleConfig = new ScheduleConfigService(prisma as never);
  const jobRuns = new JobRunsService(prisma as never);
  const summaryJob = new SummaryJobService(
    mailService as never,
    aiSummaryService as never,
    crawlingRepository as never,
    { findAll: jest.fn().mockResolvedValue(categories) } as never,
    prisma as never,
    editionService as never,
    followsService as never,
    siteCache as never,
    scheduleConfig,
    jobRuns,
  );
  const mailJob = new MailJobService(
    mailService as never,
    subscriberService as never,
    prisma as never,
    editionService as never,
    followsService as never,
    tasteService as never,
    recommendService as never,
    summaryJob,
    jobRuns,
  );
  const scheduler = new SchedulerService(
    {} as never,
    registry as never,
    scheduleConfig,
    jobRuns,
    summaryJob,
    mailJob,
  );
  // 요약 다시 시도 사이 쉬는 시간은 테스트에서 없앤다
  (
    summaryJob as unknown as { summaryRetryDelayMs: number }
  ).summaryRetryDelayMs = 0;
  return {
    scheduler,
    scheduleConfig,
    jobRuns,
    summaryJob,
    mailJob,
    crawlingRepository,
    aiSummaryService,
    editionService,
    tasteService,
    recommendService,
    followsService,
    mailService,
    siteCache,
    prisma,
    registry,
    cronJob,
  };
}
