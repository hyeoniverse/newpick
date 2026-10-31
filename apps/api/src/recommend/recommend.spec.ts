import { renderEditionMail } from '../edition/mail';
import { composeEdition } from '../edition/compose';
import { pickArticles, RECOMMEND_LIMITS } from './pick';
import { RecommendService } from './recommend.service';

const signal = (vector: number[]) => ({ vector });
const article = (title: string, vector: number[], link = title) => ({
  title,
  link,
  source: '언론사',
  category: '경제',
  vector,
});

describe('추천 기사 고르기', () => {
  const signals = [signal([1, 0, 0]), signal([0, 1, 0])];

  it(`가장 가까운 신호로 매기고 ${RECOMMEND_LIMITS.min} 이상만, 가까운 순으로`, () => {
    const picks = pickArticles(
      signals,
      [
        article('먼 기사', [0, 0, 1]),
        article('룰라 여파', [0.1, 0.95, 0.3]),
        article('코스피 하락', [0.99, 0, 0.14]),
      ],
      new Set(),
    );
    expect(picks.map((p) => p.title)).toEqual(['코스피 하락', '룰라 여파']);
    // 메일 계획에 남기는 값에는 벡터가 없다
    expect(picks[0]).not.toHaveProperty('vector');
  });

  it('같은 사건(서로 아주 가까운 기사)은 하나만, 이미 뉴스레터에 쓴 기사는 빼고, 최대 개수까지', () => {
    const picks = pickArticles(
      signals,
      [
        article('코스피 A', [1, 0, 0]),
        article('코스피 B', [0.98, 0, 0.2]),
        article('실린 기사', [0, 1, 0], 'used'),
        article('룰라 C', [0.2, 0.98, 0]),
      ],
      new Set(['used']),
    );
    expect(picks.map((p) => p.title)).toEqual(['코스피 A', '룰라 C']);
    expect(
      pickArticles(
        signals,
        [article('a', [1, 0, 0]), article('b', [0, 1, 0])],
        new Set(),
        [],
        { ...RECOMMEND_LIMITS, picks: 1 },
      ),
    ).toHaveLength(1);
  });

  it('메일에 실린 소식과 같은 사건인 기사(다른 언론사가 쓴 같은 소식)는 뺀다', () => {
    const candidates = [
      article('같은 날씨 기사', [1, 0, 0]),
      article('후속 기사', [0.6, 0.8, 0]),
    ];
    expect(
      pickArticles(signals, candidates, new Set(), [[1, 0, 0]]).map(
        (p) => p.title,
      ),
    ).toEqual(['후속 기사']);
  });

  it('신호가 없으면 아무것도 권하지 않는다', () => {
    expect(pickArticles([], [article('a', [1, 0])], new Set())).toEqual([]);
  });
});

describe('추천 기사 (RecommendService)', () => {
  const setup = (embedding?: number[]) => {
    const crawling = {
      findForRecommend: jest.fn(async () => [
        {
          title: '브라질 증시 급락',
          link: 'https://n.news/1',
          source: '한경',
          category: ['경제'],
          content: '본문',
          embedding,
        },
        {
          title: '북마크한 뉴스레터에 쓴 기사',
          link: 'https://n.news/seen',
          source: '연합',
          category: ['경제'],
          content: '본문',
          embedding: [1, 0],
        },
        {
          title: '뉴스레터에 쓴 기사',
          link: 'https://n.news/used',
          source: '연합',
          category: ['경제'],
          content: '본문',
          embedding: [1, 0],
        },
      ]),
      saveEmbeddings: jest.fn(),
    };
    const ai = { embed: jest.fn().mockResolvedValue([[1, 0]]) };
    const prisma = {
      // 사람 7이 북마크한 뉴스레터에 쓴 기사 (이미 본 기사)
      bookmark: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { userId: 7, newsletter: { usedNews: 'https://n.news/seen' } },
          ]),
      },
      highlight: { findMany: jest.fn().mockResolvedValue([]) },
      newsletter: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ usedNews: 'https://n.news/used, x' }]),
      },
    };
    return {
      service: new RecommendService(
        prisma as never,
        ai as never,
        crawling as never,
      ),
      crawling,
      ai,
    };
  };
  const window = {
    start: new Date('2026-10-30T21:00:00Z'),
    end: new Date('2026-10-31T21:00:00Z'),
  };

  it('맞춤 메일이 계산한 신호 그대로, 그날 뉴스레터 · 그 사람이 북마크한 뉴스레터에 쓴 기사는 빼고 권한다', async () => {
    const { service, crawling, ai } = setup([1, 0]);
    const result = await service.forUsers(
      [
        {
          userId: 7,
          signals: [{ kind: 'bookmark', label: 'x', vector: [1, 0] }],
        },
        { userId: 8, signals: [] },
      ],
      window,
      [64],
    );
    expect(crawling.findForRecommend).toHaveBeenCalledWith(
      window.start,
      window.end,
    );
    expect(result.get(7)!.map((a) => a.link)).toEqual(['https://n.news/1']);
    expect(result.has(8)).toBe(false);
    // 기사 임베딩이 이미 있으면 다시 계산하지 않는다
    expect(ai.embed).not.toHaveBeenCalled();
  });

  it('임베딩이 없는 기사만 계산해 남기고, 실패하면 추천 없이', async () => {
    const { service, crawling, ai } = setup(undefined);
    await service.forUsers(
      [{ userId: 7, signals: [{ kind: 'scrap', label: 'x', vector: [1, 0] }] }],
      window,
      [],
    );
    expect(ai.embed).toHaveBeenCalledTimes(1);
    expect(crawling.saveEmbeddings).toHaveBeenCalledWith([
      { link: 'https://n.news/1', embedding: [1, 0] },
    ]);

    ai.embed.mockRejectedValueOnce(new Error('할당 초과'));
    const failed = await service.forUsers(
      [{ userId: 7, signals: [{ kind: 'scrap', label: 'x', vector: [1, 0] }] }],
      window,
      [],
    );
    expect(failed.size).toBe(0);
  });
});

describe('메일의 추천 기사 칸', () => {
  const sources = [
    {
      newsletterId: 1,
      categoryId: 1,
      category: '경제',
      title: '경제',
      subtitle: null,
      summary: '',
      stories: [
        {
          kicker: '',
          heading: '코스피',
          lead: '코스피가 내렸다',
          blocks: [],
          sources: [],
        },
      ],
      watch: [],
    },
  ];
  const date = new Date('2026-10-27T09:00:00+09:00');
  const articles = [
    {
      title: '브라질 증시 급락',
      link: 'https://n.news/1',
      source: '한경',
      category: '경제',
      score: 0.8,
    },
  ];

  it('언론사 · 분야와 원문 링크만 (이유 표시 없음). 맞춤으로 고른 소식이 없어도 분야별 메일에 붙는다', () => {
    const composed = composeEdition(sources as never, null, [1], date, {
      picks: [],
      articles,
    })!;
    expect(composed.personal).toBeUndefined();
    const mail = renderEditionMail(composed, 'https://newpick.example');
    expect(mail).toContain('추천 기사');
    expect(mail).toContain('href="https://n.news/1"');
    expect(mail).toContain('한경 · 경제');
    expect(mail).not.toContain('이어져요');
  });

  it('추천이 없으면 칸이 없다', () => {
    expect(
      renderEditionMail(composeEdition(sources as never, null, [1], date)!, ''),
    ).not.toContain('추천 기사');
  });
});
