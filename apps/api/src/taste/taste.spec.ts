import { toRules } from 'src/tags/tags';
import {
  HALF_LIFE_DAYS,
  Signal,
  byCategoryScore,
  byTopicScore,
  decay,
  scoreTaste,
} from './taste';

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
    // lastAt(마지막 신호 시각)은 순서용이라 여기서는 점수만 본다
    expect(
      categories.map(({ categoryId, score }) => ({ categoryId, score })),
    ).toEqual([
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
    expect(
      topics.map(({ topic, score, bookmark, scrap, memo }) => ({
        topic,
        score,
        bookmark,
        scrap,
        memo,
      })),
    ).toEqual([
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

  it('별표한 스크랩은 2점을 더 얹는다', () => {
    const signals: Signal[] = [
      {
        kind: 'scrap',
        at: now,
        categoryId: 1,
        keywords: ['별표'],
        starred: true,
      },
      { kind: 'scrap', at: now, categoryId: 1, keywords: ['보통'] },
    ];
    expect(
      scoreTaste(signals, noRules, now).topics.map((t) => [t.topic, t.score]),
    ).toEqual([
      ['별표', 4],
      ['보통', 2],
    ]);
  });

  it('점수가 같으면 더 중요한 신호(사람 수 → 메모 → 스크랩 → 북마크) → 더 최신 → 이름 순', () => {
    const t = (
      topic: string,
      o: Partial<{
        users: number;
        memo: number;
        scrap: number;
        bookmark: number;
        lastAt: number;
      }> = {},
    ) => ({
      topic,
      score: 6,
      users: 1,
      memo: 0,
      scrap: 0,
      bookmark: 0,
      lastAt: 0,
      ...o,
    });
    const rows = [
      t('북마크만', { bookmark: 2 }),
      t('최신 북마크', { bookmark: 2, lastAt: 100 }),
      t('스크랩', { scrap: 1 }),
      t('메모', { memo: 1 }),
      t('두 사람', { users: 2 }),
      { ...t('점수 높음'), score: 7 },
      t('가'),
      t('A'),
    ];
    const order = (list: typeof rows) =>
      [...list].sort(byTopicScore).map((r) => r.topic);
    // 이름은 마지막 기준 (한국어 기준이라 한글이 영문보다 앞)
    expect(order(rows)).toEqual([
      '점수 높음',
      '두 사람',
      '메모',
      '스크랩',
      '최신 북마크',
      '북마크만',
      '가',
      'A',
    ]);
    expect(order([...rows].reverse())).toEqual(order(rows));
  });

  it('분야는 점수가 같으면 더 최신 → 분야 번호 순', () => {
    const rows = [
      { categoryId: 5, score: 3, lastAt: 10 },
      { categoryId: 2, score: 3, lastAt: 10 },
      { categoryId: 3, score: 3, lastAt: 20 },
      { categoryId: 1, score: 4, lastAt: 0 },
    ];
    const order = (list: typeof rows) =>
      [...list].sort(byCategoryScore).map((r) => r.categoryId);
    expect(order(rows)).toEqual([1, 3, 2, 5]);
    expect(order([...rows].reverse())).toEqual(order(rows));
  });

  it('응답용 태그 · 분야에 마지막 신호 시각을 담아 둔다 (순서용)', () => {
    const { topics, categories } = scoreTaste(
      [
        { kind: 'bookmark', at: daysAgo(3), categoryId: 1, keywords: ['금리'] },
        { kind: 'bookmark', at: daysAgo(1), categoryId: 1, keywords: ['금리'] },
      ],
      noRules,
      now,
    );
    expect(topics[0].lastAt).toBe(daysAgo(1).getTime());
    expect(categories[0].lastAt).toBe(daysAgo(1).getTime());
  });
});
