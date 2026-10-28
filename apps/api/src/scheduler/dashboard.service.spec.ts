import { DashboardService } from './dashboard.service';

function setup() {
  const prisma = {
    scheduleConfig: { findUnique: jest.fn().mockResolvedValue(null) },
    newsletter: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(3),
    },
    aiProcessLog: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(5),
      aggregate: jest
        .fn()
        .mockResolvedValue({ _sum: { costUsd: 0.12 }, _count: { costUsd: 4 } }),
    },
    subscriber: { count: jest.fn().mockResolvedValue(2) },
    jobRun: { findFirst: jest.fn().mockResolvedValue(null) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
  const crawling = {
    countBetween: jest.fn().mockResolvedValue(10),
    getLatestCrawledNews: jest.fn().mockResolvedValue(null),
  };
  const scheduler = {
    getSchedulerStatus: jest.fn().mockReturnValue({
      crawling: true,
      aiSummary: true,
      mailing: true,
      runs: {
        crawling: { running: false },
        summary: { running: false },
        mail: { running: false },
      },
    }),
    getSchedule: jest.fn().mockReturnValue({}),
  };
  const service = new DashboardService(
    scheduler as never,
    prisma as never,
    crawling as never,
  );
  return { service, prisma, crawling };
}

describe('DashboardService 기간 (#21)', () => {
  it('KST 날짜 경계로 기간을 잡아 센다 (10/01 0시 ~ 10/07 끝)', async () => {
    const { service, crawling } = setup();
    const data = await service.getDashboard('2026-10-01', '2026-10-07');
    const [start, end] = crawling.countBetween.mock.calls[0];
    expect(start.toISOString()).toBe('2026-09-30T15:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-07T14:59:59.999Z');
    expect(data.range).toEqual({ from: '2026-10-01', to: '2026-10-07' });
    // 비용을 모르는 기록 = 전체 5 - 비용 있는 4
    expect(data.aiCost).toEqual({ total: 0.12, unknown: 1 });
  });

  it('거꾸로 된 기간 · 92일 넘는 기간은 거절', async () => {
    const { service } = setup();
    await expect(
      service.getDashboard('2026-10-07', '2026-10-01'),
    ).rejects.toThrow('시작 날짜가 끝 날짜보다 늦어요.');
    await expect(
      service.getDashboard('2026-01-01', '2026-10-01'),
    ).rejects.toThrow('92일');
  });
});
