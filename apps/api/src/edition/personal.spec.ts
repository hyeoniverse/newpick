import { composeEdition, EditionNewsletter } from './compose';
import { renderEditionMail } from './mail';
import type { ParsedStory } from './parse';
import {
  interestScore,
  PERSONAL_LIMITS,
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
  watch: [`${category} 관전 포인트`],
});

const sources = [
  source(10, 1, '경제', [
    '코스피 하락',
    '반도체 수출 석 달째 증가',
    '환율 1400원',
  ]),
  source(20, 2, 'IT', ['AI 규제법 통과', '클라우드 장애']),
  source(30, 3, '세계', ['미국 반도체 수출 규제 강화', '룰라 4선']),
];

const profile: TasteProfile = {
  topics: [
    { name: '반도체', key: '반도체', score: 4 },
    { name: 'AI', key: 'ai', score: 2 },
  ],
};
const DATE = new Date('2026-10-31T09:00:00+09:00');
const refs = (plan: ReturnType<typeof planMail>) =>
  plan!.picks.map((p) => p.ref);

describe('관심 점수', () => {
  it('관심 태그: 소식 글에 나오는 태그 점수 합을 가장 큰 태그 점수로 나눈다', () => {
    expect(relevance('반도체수출', profile)).toBe(1);
    expect(relevance('ai반도체', profile)).toBe(1.5);
    expect(relevance('룰라4선', profile)).toBe(0);
  });

  it('임베딩: 가장 가까운 신호의 코사인을 0.5~0.8 구간으로 펴고, 그 신호가 바로 이 소식이면 이미 본 소식', () => {
    const withSignals: TasteProfile = {
      topics: [],
      signals: [
        { kind: 'scrap', label: '브라질 대선', vector: [1, 0] },
        { kind: 'bookmark', label: '룰라 4선', vector: [0, 1] },
      ],
    };
    // 코사인 0.65 → (0.65 - 0.5) / 0.3 = 0.5
    expect(
      interestScore(
        story('코스피'),
        [0.65, -Math.sqrt(1 - 0.65 ** 2)],
        withSignals,
      ).score,
    ).toBeCloseTo(0.5, 5);
    expect(interestScore(story('아무거나'), [0, 0.1], withSignals)).toEqual({
      score: 1,
      seen: false,
    });
    expect(interestScore(story('룰라 4선'), [0, 1], withSignals).seen).toBe(
      true,
    );
  });
});

describe('맞춤 계획 (planMail): 분야를 나누지 않고 점수 순', () => {
  it('점수 = 편집 중요도 + 5 × 관심 + 구독 분야 가산. 구독하지 않은 분야도 관심이 크면 들어온다', () => {
    // 경제(1) · IT(2)를 구독, 관심은 반도체
    const plan = planMail(sources, [1, 2], profile);
    // 편집 없음 → 뉴스레터 안 순서가 중요도(3, 2, 1)
    // 반도체 수출 2+5+2=9 · 미국 반도체 규제(세계) 3+5=8 · 코스피 3+2=5 · AI 규제법 3+2.5+2=7.5 ...
    expect(refs(plan).slice(0, 3)).toEqual(['10-2', '30-1', '20-1']);
    expect(plan!.picks).toHaveLength(PERSONAL_LIMITS.stories);
  });

  it('구독한 분야에서 편집 중요도가 가장 높은 소식 2개는 늘 들어간다', () => {
    const many = [
      source(10, 1, '경제', ['큰 소식 1', '큰 소식 2', '작은 소식']),
      source(
        30,
        3,
        '세계',
        Array.from({ length: 8 }, (_, i) => `반도체 ${i + 1}`),
      ),
    ];
    const editorial = {
      ranking: {
        '10-1': { importance: 5, line: '' },
        '10-2': { importance: 4, line: '' },
      },
      duplicates: [],
      threads: [],
    };
    const picks = refs(planMail(many, [1], profile, undefined, editorial));
    expect(picks).toHaveLength(PERSONAL_LIMITS.stories);
    expect(picks).toEqual(expect.arrayContaining(['10-1', '10-2']));
    expect(picks).not.toContain('10-3');
  });

  it('같은 사건(편집의 duplicates)은 하나만', () => {
    const editorial = {
      ranking: {},
      duplicates: [['10-2', '30-1']],
      threads: [],
    };
    const picks = refs(
      planMail(sources, [1, 2], profile, undefined, editorial),
    );
    expect(picks).toContain('10-2');
    expect(picks).not.toContain('30-1');
  });

  it('북마크한 그 소식이 다시 실린 것은 관심으로 치지 않는다', () => {
    const taste: TasteProfile = {
      topics: [],
      signals: [{ kind: 'bookmark', label: '룰라 4선', vector: [1, 0] }],
    };
    const vectors = new Map([
      ['30-2', [1, 0]], // 룰라 4선 그대로
      ['30-1', [0.9, 0.44]], // 가깝지만 다른 소식 (코사인 0.9)
    ]);
    const picks = refs(planMail(sources, [1, 2], taste, vectors));
    expect(picks[0]).toBe('30-1');
    expect(picks.indexOf('30-2')).toBeGreaterThan(picks.indexOf('20-1'));
  });

  it('취향이 없거나 어떤 소식에도 닿지 않으면 계획이 없다 (분야별 메일 그대로)', () => {
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

  it('계획의 소식을 점수 순 그대로: 오늘 한눈에 · 본문 순서가 같고, 분야는 실린 것만', () => {
    const mine = composeEdition(sources, null, [1, 2], DATE, plan)!;
    expect(mine.personal).toBe(true);
    expect(mine.top.map((t) => t.ref)).toEqual(refs(plan));
    expect(mine.sections.map((s) => s.stories[0].ref)).toEqual(refs(plan));
    expect(mine.categories).toEqual(['경제', '세계', 'IT']);
    expect(mine.newsletterIds).toEqual([10, 30, 20]);
    expect(mine.watch).toEqual([
      '경제 관전 포인트',
      '세계 관전 포인트',
      'IT 관전 포인트',
    ]);
  });

  it('흐름은 양쪽 소식이 모두 실렸을 때만', () => {
    const editorial = {
      ranking: {},
      duplicates: [],
      threads: [
        { title: '반도체 흐름', text: '이어진다', refs: ['10-2', '30-1'] },
        { title: '빠진 흐름', text: '안 보인다', refs: ['10-2', '99-1'] },
      ],
    };
    expect(
      composeEdition(sources, editorial, [1, 2], DATE, plan)!.threads.map(
        (t) => t.title,
      ),
    ).toEqual(['반도체 흐름']);
  });

  it('메일: 브리핑 · 소식마다 분야와 그 뉴스레터 링크, 이유 표시는 없다', () => {
    const withNote = {
      ...plan,
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
      'https://newpick.app',
      'hello@newpick.app',
    );
    expect(mail).toContain('오늘의 맞춤 브리핑');
    expect(mail).toContain('반도체 소식이 오늘 두 분야에 걸쳐 있어요.');
    expect(mail).toContain('세계 뉴스레터 전문 보기');
    expect(mail).toContain('/articles/detail/30?');
    // 분야별 묶음 머리(굵은 밑줄)가 없고 한 카드에 점수 순
    expect(mail.indexOf('미국 반도체 수출 규제 강화')).toBeLessThan(
      mail.indexOf('코스피 하락'),
    );
    expect(mail).not.toContain('관심 ·');
    expect(mail).not.toContain('이어져요');
    expect(mail).not.toMatch(/class=/);
  });

  it('맞춤이 없으면 메일은 지금과 같다 (분야별, 브리핑 없음)', () => {
    const plain = composeEdition(sources, null, [1, 2], DATE)!;
    expect(plain.personal).toBeUndefined();
    expect(plain.categories).toEqual(['경제', 'IT']);
    expect(renderEditionMail(plain, 'https://newpick.app')).not.toContain(
      '맞춤 브리핑',
    );
  });

  it('계획의 소식이 그날 뉴스레터에 없으면 분야별 메일로', () => {
    expect(
      composeEdition(sources, null, [1, 2], DATE, {
        picks: [{ ref: '99-1', newsletterId: 99 }],
      })!.personal,
    ).toBeUndefined();
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
    expect(prompt).toContain('[30-1] (세계) 미국 반도체 수출 규제 강화');
    expect(prompt).toContain('새 사실을 지어내지 않습니다');
    expect(prompt).toContain('해요체(~했어요, ~보세요)');
    expect(prompt).toContain('많아야 한 번만');
    expect(prompt).not.toContain('whys');
    expect(prompt).toContain('짐작해 쓰지 않습니다');
    expect(prompt).toContain('독자를 가르치는 말');
    expect(prompt).toContain('여성을 깎아내리거나');
  });

  it('제목 따옴표를 걷고, 제목이나 브리핑이 비면 쓰지 않는다', () => {
    expect(
      normalizeNote({ subject: '"반도체 수출 증가"', briefing: '브리핑' }),
    ).toEqual({ subject: '반도체 수출 증가', briefing: '브리핑' });
    expect(normalizeNote({ subject: '', briefing: 'x' })).toBeNull();
    expect(normalizeNote(null)).toBeNull();
  });
});
