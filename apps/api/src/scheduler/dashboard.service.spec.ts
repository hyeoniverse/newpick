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
    newsCategory: {
      findMany: jest.fn().mockResolvedValue([{ id: 3, name: '경제' }]),
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

describe('DashboardService AI 기록: 실패 뒤 다시 시도', () => {
  const log = (
    id: number,
    status: string,
    at: string,
    categoryId: number | null = 3,
  ) => ({
    id,
    processType: 'summarization',
    status,
    categoryId,
    createdAt: new Date(at),
    duration: 1,
    token: 0,
    result: '',
    error: null,
    model: null,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: null,
  });

  it('같은 분야 실패 뒤 성공을 잇고, 분야 이름을 붙인다', async () => {
    const { service, prisma } = setup();
    const failed = log(1, 'error', '2026-10-28T23:31:00Z');
    const ok = log(2, 'success', '2026-10-28T23:40:00Z');
    prisma.aiProcessLog.findMany
      .mockResolvedValueOnce([ok, failed])
      .mockResolvedValueOnce([failed, ok]);
    const { items } = await service.listAiLogs({
      from: '2026-10-29',
      to: '2026-10-29',
    });
    const byId = new Map(items.map((item) => [item.id, item]));
    expect(byId.get(1)?.retry).toEqual({ kind: 'recovered', at: ok.createdAt });
    expect(byId.get(2)?.retry).toEqual({ kind: 'retry', at: failed.createdAt });
    expect(byId.get(1)?.category).toBe('경제');
  });

  it('다시 성공하지 못한 실패, 12시간 넘게 지난 성공, 분야 없는 이전 기록은 잇지 않는다', async () => {
    const { service, prisma } = setup();
    const failed = log(1, 'error', '2026-10-28T23:31:00Z');
    const late = log(2, 'success', '2026-10-29T23:31:00Z');
    const old = log(3, 'error', '2026-10-28T23:32:00Z', null);
    prisma.aiProcessLog.findMany
      .mockResolvedValueOnce([late, old, failed])
      .mockResolvedValueOnce([failed, late]);
    const { items } = await service.listAiLogs({
      from: '2026-10-29',
      to: '2026-10-30',
    });
    expect(items.every((item) => item.retry === null)).toBe(true);
    expect(items.find((item) => item.id === 3)?.category).toBeNull();
  });
});
