import { Logger } from '@nestjs/common';
import {
  SchedulerService,
  SUMMARY_WINDOW_HOURS,
  crawlCron,
} from './scheduler.service';
import { setTimeofCycle } from 'src/common/helpers';

function setup(failingCategoryId: number, edition: unknown = null) {
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
      newsletter: [{ categoryId, content: `요약${categoryId}` }],
    })),
  };
  const editionService = {
    ensureEdition: jest.fn().mockResolvedValue(edition),
    composeMail: jest.fn((_e, interests: number[]) => ({
      subject: `분야 ${interests.join(',')}`,
      html: '',
      newsletterIds: interests,
    })),
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
    jobRun: {
      create: jest.fn().mockResolvedValue({ id: 41 }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const service = new SchedulerService(
    new Logger(),
    mailService as never,
    aiSummaryService as never,
    {} as never,
    subscriberService as never,
    crawlingRepository as never,
    { findAll: jest.fn().mockResolvedValue(categories) } as never,
    {} as never,
    registry as never,
    prisma as never,
    editionService as never,
    siteCache as never,
  );
  // 요약 다시 시도 사이 쉬는 시간은 테스트에서 없앤다
  (service as unknown as { summaryRetryDelayMs: number }).summaryRetryDelayMs =
    0;
  return {
    service,
    crawlingRepository,
    aiSummaryService,
    editionService,
    mailService,
    siteCache,
    prisma,
    registry,
    cronJob,
  };
}

describe('SchedulerService.makeAiSummary', () => {
  it('카테고리 하나가 실패해도 나머지 카테고리는 요약한다', async () => {
    const { service, aiSummaryService } = setup(2);
    await service.makeAiSummary();
    const summarized = aiSummaryService.summarizeText.mock.calls.map(
      (c) => c[1],
    );
    expect(summarized).toEqual([1, 3]);
  });

  it('실패한 관심사는 나머지를 만든 뒤 다시 시도한다 (일시적인 시간 초과)', async () => {
    const { service, aiSummaryService, prisma } = setup(0);
    aiSummaryService.summarizeText.mockRejectedValueOnce(
      new Error('Request timed out.'),
    );
    await service.makeAiSummary();
    // 3개 관심사 + 실패한 1개 다시 = 4번
    expect(aiSummaryService.summarizeText).toHaveBeenCalledTimes(4);
    const finished = prisma.jobRun.update.mock.calls.at(-1)[0].data;
    expect(finished.status).toBe('success');
    expect(finished.message).toContain('다시 시도로 1편');
  });

  it('그날의 뉴스만: 요약 시각 전 24시간 안에 모은 기사로 (예전 지난 7일 전부가 아니라)', async () => {
    const { service, crawlingRepository } = setup(0);
    await service.makeAiSummary();
    const [start, end] = crawlingRepository.getCrawledNewsBetween.mock.calls[0];
    expect(end.getTime() - start.getTime()).toBe(
      SUMMARY_WINDOW_HOURS * 60 * 60 * 1000,
    );
    expect(Date.now() - end.getTime()).toBeLessThan(5000);
  });

  it('수집은 수집 시각부터 3시간마다 하루 8번', () => {
    expect(crawlCron({ hour: 8, minute: 0 })).toBe(
      '0 0 2,5,8,11,14,17,20,23 * * *',
    );
    expect(crawlCron({ hour: 0, minute: 30 })).toBe(
      '0 30 0,3,6,9,12,15,18,21 * * *',
    );
  });
});

describe('사이트 캐시 (#73)', () => {
  it('새 뉴스레터를 만든 뒤 사이트 캐시를 한 번 비운다', async () => {
    const { service, siteCache, editionService } = setup(0);
    await service.makeAiSummary();
    expect(siteCache.refresh).toHaveBeenCalledTimes(1);
    expect(siteCache.refresh.mock.invocationCallOrder[0]).toBeGreaterThan(
      editionService.ensureEdition.mock.invocationCallOrder[0],
    );
  });

  it('만든 뉴스레터가 없으면 비우지 않는다', async () => {
    const { service, siteCache, aiSummaryService } = setup(0);
    aiSummaryService.summarizeText.mockResolvedValue({ newsletter: [] });
    await service.makeAiSummary();
    expect(siteCache.refresh).not.toHaveBeenCalled();
  });
});

describe('구독 메일 (#55)', () => {
  it('뉴스레터를 다 만든 뒤 오늘 소식을 한 번 편집해 둔다', async () => {
    const { service, aiSummaryService, editionService } = setup(0);
    await service.makeAiSummary();
    expect(editionService.ensureEdition).toHaveBeenCalledTimes(1);
    expect(
      editionService.ensureEdition.mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      aiSummaryService.summarizeText.mock.invocationCallOrder.at(-1)!,
    );
  });

  it('관심 분야가 있는 구독자마다 고른 분야로 엮은 메일을 보낸다', async () => {
    const edition = { date: '2026-10-27', sources: [], editorial: null };
    const { service, mailService, editionService } = setup(0, edition);
    await service.sendEmailSummary();

    const [subscribers] = mailService.sendBulkMail.mock.calls[0];
    expect(subscribers.map((s) => s.email)).toEqual(['a@example.com']);
    // 사람마다 원클릭 해지(#18)를 붙이도록 회원 id도 넘긴다
    expect(editionService.composeMail).toHaveBeenCalledWith(edition, [1, 3], 7);
  });

  it('오늘 나온 뉴스레터가 없으면 보내지 않는다 (어제 메일을 다시 보내지 않게)', async () => {
    const { service, mailService } = setup(0, null);
    await service.sendEmailSummary();
    expect(mailService.sendBulkMail).not.toHaveBeenCalled();
  });

  it('생성이 진행 중이면 끝난 뒤에 보낸다', async () => {
    const edition = { date: '2026-10-27', sources: [], editorial: null };
    const { service, aiSummaryService, mailService } = setup(0, edition);
    let finish: () => void;
    aiSummaryService.summarizeText.mockImplementationOnce(
      () =>
        new Promise((resolve) => (finish = () => resolve({ newsletter: [] }))),
    );
    const summary = service.makeAiSummary();
    const mail = service.sendEmailSummary();
    await new Promise((r) => setImmediate(r));
    expect(mailService.sendBulkMail).not.toHaveBeenCalled();

    finish!();
    await Promise.all([summary, mail]);
    expect(mailService.sendBulkMail).toHaveBeenCalledTimes(1);
  });

  it('발송 주기: 그 시각 40분, 7이면 매일', () => {
    expect(setTimeofCycle(8, 7)).toBe('0 40 8 * * *');
    expect(setTimeofCycle(9, 1)).toBe('0 40 9 * * 1');
  });
});

describe('작업 실행 기록 (#21)', () => {
  it('요약: 일부 관심사가 실패하면 partial과 실패한 관심사를 남긴다', async () => {
    const { service } = setup(2);
    await service.makeAiSummary();
    expect(service.getRuns().summary).toMatchObject({
      running: false,
      status: 'partial',
      message: '뉴스레터 2편 생성 · 실패: 정치',
    });
  });

  it('메일: 보낸 결과를 남기고, 오늘 뉴스레터가 없으면 skipped', async () => {
    const edition = { date: '2026-10-27', sources: [], editorial: null };
    const sent = setup(0, edition);
    await sent.service.sendEmailSummary();
    expect(sent.service.getRuns().mail).toMatchObject({
      status: 'success',
      message: '성공 1 · 실패 0 · 해당 없음 0',
    });

    const none = setup(0, null);
    await none.service.sendEmailSummary();
    expect(none.service.getRuns().mail).toMatchObject({
      status: 'skipped',
      message: '오늘 나온 뉴스레터 없음',
    });
  });

  it('꺼진 작업은 실행하지 않고 skipped', async () => {
    const { service, aiSummaryService } = setup(0);
    service.toggleAiSummaryScheduler(false);
    await service.makeAiSummary();
    expect(aiSummaryService.summarizeText).not.toHaveBeenCalled();
    expect(service.getRuns().summary.status).toBe('skipped');
  });

  it('진행 중이면 running', async () => {
    const { service, aiSummaryService } = setup(0);
    let finish: () => void;
    aiSummaryService.summarizeText.mockImplementationOnce(
      () =>
        new Promise((resolve) => (finish = () => resolve({ newsletter: [] }))),
    );
    const run = service.makeAiSummary();
    await new Promise((r) => setImmediate(r));
    expect(service.getRuns().summary.running).toBe(true);
    finish!();
    await run;
    expect(service.getRuns().summary.running).toBe(false);
  });
});

describe('실행 기록 DB (#21)', () => {
  const flush = () => new Promise((r) => setImmediate(r));

  it('예약 실행: 시작할 때 running으로 남기고, 끝나면 같은 줄을 결과로 고친다', async () => {
    const { service, prisma } = setup(2);
    await service.makeAiSummary();
    await flush();
    expect(prisma.jobRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        job: 'summary',
        trigger: 'schedule',
        status: 'running',
      }),
      select: { id: true },
    });
    expect(prisma.jobRun.update).toHaveBeenCalledWith({
      where: { id: 41 },
      data: expect.objectContaining({
        status: 'partial',
        message: '뉴스레터 2편 생성 · 실패: 정치',
      }),
    });
  });

  it("관리자의 '지금 실행'은 manual로 남는다", async () => {
    const edition = { date: '2026-10-27', sources: [], editorial: null };
    const { service, prisma } = setup(0, edition);
    await service.manualStartMailSend();
    await flush();
    expect(prisma.jobRun.create.mock.calls[0][0].data).toMatchObject({
      job: 'mail',
      trigger: 'manual',
    });
    expect(service.getRuns().mail.trigger).toBe('manual');
  });

  it('꺼져 있어 건너뛰면 skipped 한 줄만', async () => {
    const { service, prisma } = setup(0);
    service.toggleCrawlingScheduler(false);
    await service.startCrawling();
    await flush();
    expect(prisma.jobRun.create).toHaveBeenCalledTimes(1);
    expect(prisma.jobRun.create.mock.calls[0][0].data).toMatchObject({
      job: 'crawling',
      status: 'skipped',
    });
  });
});

describe('예약 시간 바꾸기 (#21)', () => {
  const at = (hour: number, minute: number) => ({ hour, minute });

  it('수집 → 요약 → 메일 순서면 저장하고 세 작업을 다시 건다', async () => {
    const { service, prisma, registry, cronJob } = setup(0);
    const next = {
      crawl: at(7, 0),
      summary: at(7, 20),
      mail: { ...at(7, 45), day: 1 },
    };
    await expect(service.setSchedule(next)).resolves.toEqual(next);
    expect(prisma.scheduleConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          crawlHour: 7,
          crawlMinute: 0,
          summaryHour: 7,
          summaryMinute: 20,
          hour: 7,
          mailMinute: 45,
          day: 1,
        },
      }),
    );
    expect(registry.getCronJob.mock.calls.map((c) => c[0])).toEqual([
      'startCrawling',
      'makeAiSummary',
      'sendNewsletter',
    ]);
    expect(cronJob.setTime).toHaveBeenCalledTimes(3);
    expect(service.getSchedule()).toEqual(next);
  });

  it('순서가 어긋나면 거절하고 아무것도 바꾸지 않는다', async () => {
    const { service, prisma } = setup(0);
    await expect(
      service.setSchedule({
        crawl: at(8, 30),
        summary: at(8, 0),
        mail: { ...at(8, 40), day: 7 },
      }),
    ).rejects.toThrow('순서');
    expect(prisma.scheduleConfig.upsert).not.toHaveBeenCalled();
  });
});
