import { composeEdition, EditionNewsletter } from './compose';
import { renderEditionMail } from './mail';
import type { ParsedStory } from './parse';
import {
  interestScore,
  planMail,
  relevance,
  TasteProfile,
} from './personalize';
import { normalizeNote, notePrompt } from './personalNote';

const story = (heading: string, lead = `${heading} 리드`): ParsedStory => ({
  kicker: '',
  heading,
  lead,
  blocks: [{ type: 'body', paragraphs: [[{ text: `${heading} 본문` }]] }],
  sources: [],
});

const source = (
  newsletterId: number,
  categoryId: number,
  category: string,
  headings: string[],
): EditionNewsletter => ({
  newsletterId,
  categoryId,
  category,
  title: `${category} 제목`,
  subtitle: null,
  summary: '',
  stories: headings.map((h) => story(h)),
  watch: [],
});

const sources = [
  source(10, 1, '경제', [
    '코스피 하락',
    '반도체 수출 석 달째 증가',
    '환율 1400원',
  ]),
  source(20, 2, 'IT', ['AI 규제법 통과']),
  source(30, 3, '세계', ['미국 반도체 수출 규제 강화', '룰라 4선']),
];

const profile: TasteProfile = {
  topics: [
    { name: '반도체', key: '반도체', score: 4 },
    { name: 'AI', key: 'ai', score: 2 },
  ],
};
const DATE = new Date('2026-10-31T09:00:00+09:00');

describe('맞춤 계획 (planMail)', () => {
  it('소식 글에 나오는 관심 태그 점수 합을 가장 큰 관심 점수로 나눈다', () => {
    expect(relevance('반도체수출', profile)).toEqual({
      rel: 1,
      topics: ['반도체'],
    });
    expect(relevance('ai반도체', profile)).toEqual({
      rel: 1.5,
      topics: ['반도체', 'AI'],
    });
    expect(relevance('룰라4선', profile).rel).toBe(0);
  });

  it('임베딩이 없으면 관심 태그로: 고른 분야는 앞당기고(최대 +5), 고르지 않은 분야는 강하게 닿는 소식을 더한다', () => {
    const plan = planMail(sources, [1, 2], profile)!;
    expect(plan.boosts).toEqual({
      '10-2': { bonus: 5, topics: ['반도체'] },
      '20-1': { bonus: 2.5, topics: ['AI'] },
    });
    expect(plan.extras).toEqual([
      { ref: '30-1', newsletterId: 30, topics: ['반도체'] },
    ]);
  });

  it('임베딩이 있으면 뜻으로: 가장 가까운 신호를 0.5~0.8 구간으로 펴고, 태그가 안 닿으면 그 신호를 이유로', () => {
    const withSignals: TasteProfile = {
      topics: [],
      signals: [
        { kind: 'scrap', label: '브라질 대선', vector: [1, 0] },
        { kind: 'bookmark', label: '코스피 최저', vector: [0, 1] },
      ],
    };
    // 코사인 0.65 → (0.65 - 0.5) / 0.3 = 0.5
    expect(
      interestScore('', [0.65, Math.sqrt(1 - 0.65 ** 2)], withSignals),
    ).toMatchObject({
      topics: [],
      because: { kind: 'bookmark', label: '코스피 최저' },
    });
    expect(interestScore('', [1, 0], withSignals).score).toBe(1);
    expect(interestScore('', [0.3, 0.3], withSignals).score).toBeCloseTo(
      0.69,
      2,
    );

    const vectors = new Map([
      ['30-2', [1, 0]], // 룰라 4선 ← 브라질 대선: 고르지 않은 세계 분야 → 관심 가질 만한 소식
      ['10-1', [0.62, 0.78]], // 코스피 하락: 코스피 최저와 가깝다 (코사인 0.78 → +4.71)
      ['20-1', [0.5, 0.5]], // 둘 다와 0.71 → +3.45 · 이유는 먼저 나온 신호
    ]);
    const plan = planMail(sources, [1, 2], withSignals, vectors)!;
    expect(plan.boosts).toEqual({
      '10-1': {
        bonus: 4.71,
        topics: [],
        because: { kind: 'bookmark', label: '코스피 최저' },
      },
      '20-1': {
        bonus: 3.45,
        topics: [],
        because: { kind: 'scrap', label: '브라질 대선' },
      },
    });
    expect(plan.extras).toEqual([
      {
        ref: '30-2',
        newsletterId: 30,
        topics: [],
        because: { kind: 'scrap', label: '브라질 대선' },
      },
    ]);
  });

  it('북마크한 그 소식이 다시 실린 것은 다른 분야에서 더하지 않는다', () => {
    const plan = planMail(
      sources,
      [1],
      {
        topics: [],
        signals: [{ kind: 'bookmark', label: '룰라 4선', vector: [1, 0] }],
      },
      new Map([['30-2', [1, 0]]]),
    );
    expect(plan).toBeNull();
  });

  it('취향이 없거나 닿는 소식이 없으면 계획이 없다 (지금 그대로)', () => {
    expect(planMail(sources, [1], null)).toBeNull();
    expect(planMail(sources, [1], { topics: [] })).toBeNull();
    expect(
      planMail(sources, [1], {
        topics: [{ name: '야구', key: '야구', score: 1 }],
      }),
    ).toBeNull();
  });
});

describe('맞춤 메일 엮기', () => {
  const plan = planMail(sources, [1, 2], profile)!;

  it('취향에 닿는 소식이 오늘 한눈에 앞으로, 이유와 다른 분야 소식이 붙는다', () => {
    const plain = composeEdition(sources, null, [1, 2], DATE)!;
    const mine = composeEdition(sources, null, [1, 2], DATE, plan)!;
    expect(plain.top[0].heading).toBe('코스피 하락');
    expect(mine.top[0]).toMatchObject({
      heading: '반도체 수출 석 달째 증가',
      reason: { topics: ['반도체'] },
    });
    expect(mine.extras).toEqual([
      expect.objectContaining({
        ref: '30-1',
        category: '세계',
        heading: '미국 반도체 수출 규제 강화',
      }),
    ]);
    expect(plain.extras).toEqual([]);
  });

  it('맞춤이어도 그날 편집 중요도가 가장 높은 2개는 오늘 한눈에 남는다', () => {
    const many = [
      source(10, 1, '경제', [
        '큰 소식 1',
        '큰 소식 2',
        '관심 1',
        '관심 2',
        '관심 3',
        '관심 4',
      ]),
    ];
    const editorial = {
      ranking: Object.fromEntries(
        [5, 5, 1, 1, 1, 1].map((importance, i) => [
          `10-${i + 1}`,
          { importance, line: '' },
        ]),
      ),
      duplicates: [],
      threads: [],
    };
    const boosts = Object.fromEntries(
      ['10-3', '10-4', '10-5', '10-6'].map((ref) => [
        ref,
        { bonus: 5, topics: ['관심'] },
      ]),
    );
    const top = composeEdition(many, editorial, [1], DATE, {
      boosts,
      extras: [],
    })!.top.map((t) => t.heading);
    expect(top).toHaveLength(5);
    expect(top).toEqual(
      expect.arrayContaining([
        '큰 소식 1',
        '큰 소식 2',
        '관심 1',
        '관심 2',
        '관심 3',
      ]),
    );
  });

  it('같은 사건이 이미 메일에 있으면 다른 분야 소식은 더하지 않는다', () => {
    const editorial = {
      ranking: {},
      duplicates: [['10-2', '30-1']],
      threads: [],
    };
    expect(
      composeEdition(sources, editorial, [1, 2], DATE, plan)!.extras,
    ).toEqual([]);
  });

  it('사람마다 쓴 제목 · 브리핑과, 소식마다 계산한 이유가 메일에 들어간다', () => {
    const withNote = {
      ...plan,
      boosts: {
        ...plan.boosts,
        '10-1': {
          bonus: 1,
          topics: [],
          because: { kind: 'scrap' as const, label: '룰라 4선' },
        },
      },
      note: {
        subject: '반도체 수출 증가, 규제 강화와 맞물려',
        briefing: '반도체 소식이 오늘 두 분야에 걸쳐 있어요.',
      },
    };
    const composed = composeEdition(sources, null, [1, 2], DATE, withNote)!;
    expect(composed.subject).toBe(
      '10월 31일 뉴픽 · 반도체 수출 증가, 규제 강화와 맞물려',
    );
    const mail = renderEditionMail(
      composed,
      'https://newpick.app/',
      'hello@newpick.app',
    );
    expect(mail).toContain('오늘의 맞춤 브리핑');
    expect(mail).toContain('반도체 소식이 오늘 두 분야에 걸쳐 있어요.');
    expect(mail).toContain('관심 · 반도체');
    expect(mail).toContain('스크랩한 「룰라 4선」와 이어져요');
    expect(mail).toContain('관심 가질 만한 소식');
    expect(mail).not.toContain('→ ');
    expect(mail).not.toMatch(/class=/);
  });

  it('맞춤이 없으면 메일은 지금과 같다 (브리핑 · 추가 칸 없음)', () => {
    const mail = renderEditionMail(
      composeEdition(sources, null, [1, 2], DATE)!,
      'https://newpick.app/',
    );
    expect(mail).not.toContain('맞춤 브리핑');
    expect(mail).not.toContain('관심 가질 만한 소식');
  });
});

describe('사람마다 쓰는 글 (personalNote)', () => {
  const composed = composeEdition(
    sources,
    null,
    [1, 2],
    DATE,
    planMail(sources, [1, 2], profile),
  )!;

  it('프롬프트에 관심 주제 · 오늘 소식 · 원칙이 들어간다', () => {
    const prompt = notePrompt(composed, profile);
    expect(prompt).toContain('반도체, AI');
    expect(prompt).toContain('[30-1] (세계, 구독하지 않은 분야)');
    expect(prompt).toContain('새 사실을 지어내지 않습니다');
    expect(prompt).toContain('해요체(~했어요, ~보세요)');
    expect(prompt).toContain('많아야 한 번만');
    expect(prompt).not.toContain('whys');
    expect(prompt).toContain('짐작해 쓰지 않습니다');
    expect(prompt).toContain('독자를 가르치는 말');
    expect(prompt).toContain('여성을 깎아내리거나');
  });

  it('소식마다 닿은 관심을 넘긴다 (브리핑이 일반론으로 흐르지 않게)', () => {
    expect(notePrompt(composed, profile)).toMatch(
      /\[10-2\] .*\(닿은 관심: [^)]+\)/,
    );
  });

  it('제목 따옴표를 걷고, 제목이나 브리핑이 비면 쓰지 않는다', () => {
    expect(
      normalizeNote({ subject: '"반도체 수출 증가"', briefing: '브리핑' }),
    ).toEqual({ subject: '반도체 수출 증가', briefing: '브리핑' });
    expect(normalizeNote({ subject: '', briefing: 'x' })).toBeNull();
    expect(normalizeNote(null)).toBeNull();
  });
});
