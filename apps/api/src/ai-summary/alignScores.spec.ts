import type { Cluster } from './articlePrep';
import {
  alignScores,
  rankClusters,
  selectPrompt,
  type ClusterScore,
} from './newsletterWriter.service';

const cluster = (...titles: string[]): Cluster => ({
  articles: titles.map(
    (title, i) => ({ index: i, title, content: '본문', source: 'A' }) as never,
  ),
});

const score = (
  n: number,
  title: string | undefined,
  total: number,
  reason = '',
): ClusterScore => {
  const each = Math.round(total / 4);
  return {
    n,
    title,
    impact: each,
    novelty: each,
    relevance: each,
    followup: each,
    excluded: false,
    repeat: false,
    reason,
  };
};

// 2026-11-07 세계 뉴스레터: 묶음이 많은 날 고르기 모델이 번호를 밀려 써서 '아우디'가 '미국 고용' 점수로 뽑혔다
const clusters = [
  cluster('아우디, 새로 짓는 미국 조지아 공장에 최대 9조원 투입'),
  cluster(
    "美 10월 일자리 16만5000개 '깜짝 증가'… 연준 금리 인상 가능성",
    '미 10월 고용 깜짝 증가',
  ),
  cluster('미국 베선트 재무, 중국 허리펑 부총리에 “부산합의 즉각 이행”'),
  cluster('호르무즈 해협서 기뢰 충돌…이란전쟁 확전 우려'),
];

describe('고르기 번호 맞추기 (alignScores)', () => {
  it('번호와 제목이 맞으면 그대로, 다른 묶음 제목이면 그 번호로 바로잡는다', () => {
    const { scores, fixed, dropped } = alignScores(clusters, [
      score(1, '美 10월 일자리 16만5000개', 18, '미국 고용 깜짝 증가'),
      score(3, '호르무즈 해협서 기뢰 충돌', 16, '호르무즈 기뢰 충돌'),
      score(4, '아우디, 새로 짓는 미국', 12, '아우디 투자'),
    ]);
    expect(scores.map((s) => s.n)).toEqual([2, 4, 1]);
    expect(fixed).toBe(3);
    expect(dropped).toBe(0);
    // 바로잡은 뒤에는 '미국 고용'이 1등으로 뽑힌다
    expect(rankClusters(clusters, scores)[0]).toBe(2);
  });

  it('띄어쓰기 · 따옴표 · 기호가 달라도 같은 제목으로 본다', () => {
    const { scores, fixed } = alignScores(clusters, [
      score(3, '미국 베선트재무 중국 허리펑 부총리에 "부산합의', 15),
    ]);
    expect(scores[0].n).toBe(3);
    expect(fixed).toBe(0);
  });

  it('어디와도 맞지 않으면 버리고, 제목을 적지 않은 예전 형식은 그대로 둔다', () => {
    const { scores, dropped } = alignScores(clusters, [
      score(2, '전혀 없는 소식 제목입니다', 20),
      score(4, undefined, 14),
    ]);
    expect(scores.map((s) => s.n)).toEqual([4]);
    expect(dropped).toBe(1);
  });

  it('프롬프트에 제목 앞부분을 함께 적으라고 알린다', () => {
    expect(selectPrompt(clusters)).toContain(
      'title에 그 번호 소식의 첫 제목 앞부분',
    );
  });
});
