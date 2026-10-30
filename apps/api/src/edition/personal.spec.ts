import { composeEdition, EditionNewsletter } from './compose';
import { renderEditionMail } from './mail';
import type { ParsedStory } from './parse';
import { planMail, relevance, TasteProfile } from './personalize';
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

  it('고른 분야는 앞당기고(최대 +2), 고르지 않은 분야는 강하게 닿는 소식을 더한다', () => {
    const plan = planMail(sources, [1, 2], profile)!;
    expect(plan.boosts).toEqual({
      '10-2': { bonus: 2, topics: ['반도체'] },
      '20-1': { bonus: 1, topics: ['AI'] },
    });
    expect(plan.extras).toEqual([
      { ref: '30-1', newsletterId: 30, topics: ['반도체'] },
    ]);
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
      topics: ['반도체'],
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

  it('사람마다 쓴 제목 · 브리핑 · 나에게 왜가 메일에 들어간다', () => {
    const withNote = {
      ...plan,
      note: {
        subject: '반도체 수출 증가, 규제 강화와 맞물려',
        briefing: '반도체 소식이 오늘 두 분야에 걸쳐 있다.',
        whys: {
          '10-2': '관심 주제인 반도체 업황의 직접 신호다',
          '30-1': '수출 규제가 업황을 바꿀 변수다',
        },
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
    expect(mail).toContain('반도체 소식이 오늘 두 분야에 걸쳐 있다.');
    expect(mail).toContain('→ 관심 주제인 반도체 업황의 직접 신호다');
    expect(mail).toContain('관심 가질 만한 소식');
    expect(mail).toContain('→ 수출 규제가 업황을 바꿀 변수다');
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
    expect(prompt).toContain('briefing과 whys 모두 해요체');
    expect(prompt).toContain('짐작하지 않습니다');
    expect(prompt).toContain('독자를 가르치는 말');
    expect(prompt).toContain('여성을 깎아내리거나');
  });

  it("'나에게 왜'는 관심 태그와 닿은 소식 · 다른 분야에서 더한 소식에만", () => {
    const prompt = notePrompt(composed, profile);
    expect(prompt).toContain('이 소식들만 하나씩: 10-2, 20-1, 30-1');
    // 닿은 관심 주제를 소식마다 넘긴다 (일반론 대신 그 주제로 잇게)
    expect(prompt).toMatch(/\[10-2\] .*\(닿은 관심: [^)]+\)/);
    expect(
      normalizeNote(
        {
          subject: '제목',
          briefing: '브리핑',
          whys: [{ ref: '10-1', why: '닿지 않은 소식' }],
        },
        composed,
      )?.whys,
    ).toEqual({});
  });

  it('메일에 있는 소식 번호만 남기고, 제목이나 브리핑이 비면 쓰지 않는다', () => {
    expect(
      normalizeNote(
        {
          subject: '"반도체 수출 증가"',
          briefing: '브리핑',
          whys: [
            { ref: '[10-2]', why: '이유' },
            { ref: '99-1', why: '없는 소식' },
          ],
        },
        composed,
      ),
    ).toEqual({
      subject: '반도체 수출 증가',
      briefing: '브리핑',
      whys: { '10-2': '이유' },
    });
    expect(
      normalizeNote({ subject: '', briefing: 'x', whys: [] }, composed),
    ).toBeNull();
    expect(normalizeNote(null, composed)).toBeNull();
  });
});
