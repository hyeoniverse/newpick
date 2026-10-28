import { MIXED, StatsService } from './stats.service';

/** KST 날짜 · 시각 → Date (예: '2026-10-02 09:00') */
const kst = (text: string) => new Date(`${text.replace(' ', 'T')}:00+09:00`);

function fakePrisma(data: {
  events?: { userId: number; type: string; at: Date }[];
  logs?: Record<string, unknown>[];
  newsletters?: Record<string, unknown>[];
  monthCost?: number;
}) {
  return {
    subscriptionEvent: {
      findMany: jest.fn().mockResolvedValue(data.events ?? []),
      aggregate: jest
        .fn()
        .mockResolvedValue({ _min: { createdAt: kst('2026-10-01 00:00') } }),
    },
    newsCategory: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, name: 'IT' },
        { id: 3, name: '경제' },
      ]),
    },
    userInterest: {
      groupBy: jest
        .fn()
        .mockResolvedValue([{ categoryId: 1, _count: { _all: 2 } }]),
    },
    subscriber: { count: jest.fn().mockResolvedValue(2) },
    aiProcessLog: {
      findMany: jest.fn().mockResolvedValue(data.logs ?? []),
      aggregate: jest
        .fn()
        .mockResolvedValue({ _sum: { costUsd: data.monthCost ?? 0 } }),
    },
    newsletter: {
      findMany: jest.fn().mockResolvedValue(data.newsletters ?? []),
    },
  };
}

describe('StatsService.subscribers (#122)', () => {
  it('기록을 처음부터 따라가 날짜별 구독 중 수를 맞춘다 (기간 전 기록은 시작 값으로)', async () => {
    const prisma = fakePrisma({
      events: [
        { userId: 1, type: 'subscribe', at: kst('2026-09-20 10:00') },
        { userId: 2, type: 'subscribe', at: kst('2026-10-01 08:00') },
        { userId: 1, type: 'pause', at: kst('2026-10-02 23:30') },
        { userId: 3, type: 'subscribe', at: kst('2026-10-02 23:50') },
        { userId: 1, type: 'resume', at: kst('2026-10-03 00:10') },
        { userId: 2, type: 'cancel', at: kst('2026-10-03 12:00') },
      ],
    });
    const result = await new StatsService(prisma as never).subscribers(
      '2026-10-01',
      '2026-10-03',
    );

    expect(result.days).toEqual([
      {
        date: '2026-10-01',
        subscribe: 1,
        resume: 0,
        pause: 0,
        cancel: 0,
        active: 2,
      },
      // KST 밤 11시대 기록도 그날로 (UTC로 묶으면 다음 날로 밀린다)
      {
        date: '2026-10-02',
        subscribe: 1,
        resume: 0,
        pause: 1,
        cancel: 0,
        active: 2,
      },
      {
        date: '2026-10-03',
        subscribe: 0,
        resume: 1,
        pause: 0,
        cancel: 1,
        active: 2,
      },
    ]);
    expect(result.totals).toMatchObject({
      activeStart: 1,
      activeEnd: 2,
      subscribe: 2,
      cancel: 1,
    });
    expect(result.since).toBe('2026-10-01');
    expect(result.byCategory).toEqual([
      { id: 1, name: 'IT', active: 2 },
      { id: 3, name: '경제', active: 0 },
    ]);
  });

  it('이미 구독 중인 사람의 subscribe가 또 와도 두 번 세지 않는다', async () => {
    const prisma = fakePrisma({
      events: [
        { userId: 1, type: 'subscribe', at: kst('2026-10-01 08:00') },
        { userId: 1, type: 'subscribe', at: kst('2026-10-01 09:00') },
      ],
    });
    const result = await new StatsService(prisma as never).subscribers(
      '2026-10-01',
      '2026-10-01',
    );
    expect(result.days[0].active).toBe(1);
  });
});

describe('StatsService.cost (#122)', () => {
  const log = (over: Record<string, unknown>) => ({
    createdAt: kst('2026-10-02 08:30'),
    processType: 'summarization',
    status: 'success',
    newsId: 'https://a,https://b',
    model: null,
    costUsd: null,
    calls: null,
    ...over,
  });

  it('호출별 기록은 모델 · 단계로 나누고, 이전 기록은 모델이 하나면 그 모델 · 섞였으면 mixed로', async () => {
    const prisma = fakePrisma({
      logs: [
        log({
          costUsd: 0.03,
          calls: [
            {
              stage: 'select',
              model: 'claude-haiku-5-5',
              input: 1,
              output: 1,
              costUsd: 0.01,
            },
            {
              stage: 'write',
              model: 'claude-sonnet-5',
              input: 1,
              output: 1,
              costUsd: 0.02,
            },
          ],
        }),
        log({
          costUsd: 0.04,
          model: 'claude-haiku-5-5, claude-sonnet-5',
          newsId: 'https://c',
        }),
        log({
          processType: 'edition',
          costUsd: 0.005,
          model: 'claude-sonnet-5',
          newsId: '1,2',
        }),
      ],
      newsletters: [
        {
          usedNews: 'https://a,https://b',
          categoryId: 1,
          createdAt: kst('2026-10-02 08:31'),
        },
        {
          usedNews: 'https://c',
          categoryId: 3,
          createdAt: kst('2026-10-02 08:32'),
        },
      ],
    });
    const result = await new StatsService(prisma as never).cost(
      '2026-10-02',
      '2026-10-02',
    );

    expect(result.total).toBe(0.075);
    expect(result.byModel).toEqual([
      { key: MIXED, cost: 0.04 },
      { key: 'claude-sonnet-5', cost: 0.025 },
      { key: 'claude-haiku-5-5', cost: 0.01 },
    ]);
    expect(result.byStage).toEqual([
      { key: MIXED, cost: 0.04 },
      { key: 'write', cost: 0.02 },
      { key: 'select', cost: 0.01 },
      { key: 'edition', cost: 0.005 },
    ]);
    // 쓴 기사 링크가 같은 뉴스레터의 관심사로. 하루 편집은 공통(null)
    expect(result.byCategory).toEqual([
      { id: 3, name: '경제', cost: 0.04 },
      { id: 1, name: 'IT', cost: 0.03 },
      { id: null, name: null, cost: 0.005 },
    ]);
    expect(result.perNewsletter).toBe(0.0375);
  });

  it('비용을 모르는 기록은 합계에서 빼고 모름으로, 실패는 실패로 따로 센다', async () => {
    const prisma = fakePrisma({
      logs: [
        log({ costUsd: 0.01, model: 'claude-sonnet-5' }),
        log({}),
        log({ status: 'error' }),
      ],
    });
    const result = await new StatsService(prisma as never).cost(
      '2026-10-02',
      '2026-10-02',
    );
    expect(result).toMatchObject({
      total: 0.01,
      count: 3,
      unknown: 1,
      failed: 1,
    });
    expect(result.byType).toEqual([
      { key: 'summarization', cost: 0.01, count: 3, unknown: 1, failed: 1 },
    ]);
  });
});
