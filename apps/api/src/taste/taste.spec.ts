import { toRules } from 'src/tags/tags';
import { HALF_LIFE_DAYS, Signal, decay, scoreTaste } from './taste';

const now = new Date('2026-10-28T00:00:00Z');
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const noRules = toRules([]);

describe('취향 점수 (#123 2단계)', () => {
  it('반감기마다 신호가 절반으로 줄어든다', () => {
    expect(decay(now, now)).toBe(1);
    expect(decay(daysAgo(HALF_LIFE_DAYS), now)).toBeCloseTo(0.5);
    expect(decay(daysAgo(HALF_LIFE_DAYS * 2), now)).toBeCloseTo(0.25);
  });

  it('북마크 1 · 스크랩 2 · 메모 3, 문장에 태그가 나오면 1을 더 얹는다', () => {
    const signals: Signal[] = [
      {
        kind: 'bookmark',
        at: now,
        categoryId: 1,
        keywords: ['반도체', '엔비디아'],
      },
      {
        kind: 'scrap',
        at: now,
        categoryId: 1,
        keywords: ['반도체'],
        text: '엔비디아 실적이 반도체 주가를 끌었다',
      },
      {
        kind: 'memo',
        at: now,
        categoryId: 3,
        keywords: ['금리'],
        text: '금리 동결 확률',
      },
    ];
    const { topics, categories } = scoreTaste(signals, noRules, now);
    expect(topics.map((t) => [t.topic, t.score])).toEqual([
      ['금리', 4],
      ['반도체', 4],
      ['엔비디아', 1],
    ]);
    expect(topics.find((t) => t.topic === '반도체')).toMatchObject({
      bookmark: 1,
      scrap: 1,
      memo: 0,
    });
    expect(categories).toEqual([
      { categoryId: 1, score: 3 },
      { categoryId: 3, score: 3 },
    ]);
  });

  it('지금의 합치기 · 지우기 규칙을 다시 적용하고, 띄어쓰기 · 대소문자만 다른 태그는 하나로 (많이 쓴 표기로)', () => {
    const rules = toRules([
      { keyword: 'AI칩', action: 'alias', target: 'AI 반도체' },
      { keyword: '속보', action: 'block', target: null },
    ]);
    const signals: Signal[] = [
      { kind: 'bookmark', at: now, categoryId: 1, keywords: ['AI칩', '속보'] },
      { kind: 'bookmark', at: now, categoryId: 1, keywords: ['AI 반도체'] },
      { kind: 'bookmark', at: now, categoryId: 1, keywords: ['ai반도체'] },
    ];
    const { topics } = scoreTaste(signals, rules, now);
    expect(topics).toEqual([
      { topic: 'AI 반도체', score: 3, bookmark: 3, scrap: 0, memo: 0 },
    ]);
  });

  it('요즘 신호가 오래된 신호보다 앞에 온다', () => {
    const signals: Signal[] = [
      { kind: 'memo', at: daysAgo(60), categoryId: 1, keywords: ['예전 관심'] },
      {
        kind: 'bookmark',
        at: daysAgo(1),
        categoryId: 2,
        keywords: ['요즘 관심'],
      },
    ];
    expect(scoreTaste(signals, noRules, now).topics[0].topic).toBe('요즘 관심');
  });
});
