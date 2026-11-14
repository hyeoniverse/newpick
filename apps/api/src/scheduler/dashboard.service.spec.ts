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
    ).rejects.toThrow('시작 날짜가 끝 날짜보다 늦습니다.');
    await expect(
      service.getDashboard('2026-01-01', '2026-10-01'),
    ).rejects.toThrow('92일');
  });
});

describe('DashboardService AI 기록: 분야별 시도 묶음', () => {
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

  it('같은 분야 실패 → 실패 → 성공은 한 묶음 1 · 2 · 3차, 성공 뒤 시도는 새 묶음', async () => {
    const { service, prisma } = setup();
    const a = log(1, 'error', '2026-10-28T23:31:00Z');
    const b = log(2, 'error', '2026-10-28T23:40:00Z');
    const c = log(3, 'success', '2026-10-28T23:50:00Z');
    const next = log(4, 'success', '2026-10-29T23:31:00Z');
    prisma.aiProcessLog.findMany
      .mockResolvedValueOnce([next, c, b, a])
      .mockResolvedValueOnce([a, b, c, next]);
    const { items } = await service.listAiLogs({
      from: '2026-10-29',
      to: '2026-10-30',
    });
    const byId = new Map(items.map((item) => [item.id, item.attempt]));
    expect(byId.get(1)).toEqual({
      n: 1,
      total: 3,
      outcome: 'success',
      chain: 1,
    });
    expect(byId.get(2)).toEqual({
      n: 2,
      total: 3,
      outcome: 'success',
      chain: 1,
    });
    expect(byId.get(3)).toEqual({
      n: 3,
      total: 3,
      outcome: 'success',
      chain: 1,
    });
    expect(byId.get(4)).toEqual({
      n: 1,
      total: 1,
      outcome: 'success',
      chain: 4,
    });
    expect(items[0].category).toBe('경제');
  });

  it('12시간 넘게 떨어진 실패는 따로, 다른 분야 · 분야 없는 이전 기록은 묶지 않는다', async () => {
    const { service, prisma } = setup();
    const a = log(1, 'error', '2026-10-28T23:31:00Z');
    const late = log(2, 'error', '2026-10-29T23:31:00Z');
    const other = log(3, 'success', '2026-10-28T23:35:00Z', 6);
    const old = log(4, 'error', '2026-10-28T23:32:00Z', null);
    prisma.aiProcessLog.findMany
      .mockResolvedValueOnce([late, old, other, a])
      .mockResolvedValueOnce([a, other, late]);
    const { items } = await service.listAiLogs({
      from: '2026-10-29',
      to: '2026-10-30',
    });
    const byId = new Map(items.map((item) => [item.id, item.attempt]));
    expect(byId.get(1)).toMatchObject({ n: 1, total: 1, outcome: 'error' });
    expect(byId.get(2)).toMatchObject({ n: 1, total: 1, outcome: 'error' });
    expect(byId.get(3)).toMatchObject({ n: 1, total: 1, outcome: 'success' });
    expect(byId.get(4)).toBeNull();
  });
});
