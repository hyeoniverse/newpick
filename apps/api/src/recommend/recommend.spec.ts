import { renderEditionMail } from '../edition/mail';
import { composeEdition } from '../edition/compose';
import { pickArticles, RECOMMEND_LIMITS, signalLabel } from './pick';

const signal = (
  label: string,
  vector: number[],
  kind = 'bookmark' as const,
) => ({
  kind,
  label,
  vector,
});
const article = (title: string, vector: number[], link = title) => ({
  title,
  link,
  source: '언론사',
  category: '경제',
  vector,
});

describe('추천 기사 고르기', () => {
  const signals = [
    signal('코스피 최저', [1, 0, 0]),
    signal('룰라 4선', [0, 1, 0], 'scrap' as never),
  ];

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
    // 왜 권했는지: 가장 가까운 신호 그대로
    expect(picks[1].because).toEqual({ kind: 'scrap', label: '룰라 4선' });
  });

  it('같은 사건(서로 아주 가까운 기사)은 하나만, 이미 실린 기사는 빼고, 최대 개수까지', () => {
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
        { ...RECOMMEND_LIMITS, picks: 1 },
      ),
    ).toHaveLength(1);
  });

  it('신호가 없으면 아무것도 권하지 않는다', () => {
    expect(pickArticles([], [article('a', [1, 0])], new Set())).toEqual([]);
  });

  it('스크랩 문장은 앞부분만 이름으로', () => {
    expect(signalLabel('  가나다라마바사  아자차카 ', 6)).toBe('가나다라마바…');
    expect(signalLabel('짧은 문장')).toBe('짧은 문장');
  });

  it('메일: 추천 기사 칸에 원문 링크와 이어진 북마크 · 스크랩을 보여 준다 (없으면 칸이 없다)', () => {
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
    const pick = {
      title: '브라질 증시 급락',
      link: 'https://n.news/1',
      source: '한경',
      category: '경제',
      because: { kind: 'scrap' as const, label: '룰라 4선' },
      score: 0.8,
    };
    const mail = renderEditionMail(
      composeEdition(sources as never, null, [1], date, {
        boosts: {},
        extras: [],
        picks: [pick],
      })!,
      'https://newpick.example',
    );
    expect(mail).toContain('추천 기사');
    expect(mail).toContain('href="https://n.news/1"');
    expect(mail).toContain('스크랩한 「룰라 4선」와 이어져요');
    expect(
      renderEditionMail(composeEdition(sources as never, null, [1], date)!, ''),
    ).not.toContain('추천 기사');
  });
});
