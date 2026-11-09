import { type Cluster, selectCandidates } from './article-prep';

const cluster = (reports: number, morning = false): Cluster => ({
  articles: Array.from(
    { length: reports },
    (_, i) => ({ title: `${reports}-${i}`, morning }) as never,
  ),
});

describe('selectCandidates (고르기 후보 추리기)', () => {
  it('한도 안이면 그대로', () => {
    const clusters = [cluster(3), cluster(1)];
    expect(selectCandidates(clusters, 5, 2)).toBe(clusters);
  });

  it('보도 많은 묶음부터 한도만큼 + 거기 못 든 아침 속보 묶음, 순서는 그대로', () => {
    const big = [cluster(9), cluster(8), cluster(7)];
    const smallMorning = [cluster(1, true), cluster(1, true), cluster(1, true)];
    const small = [cluster(1), cluster(1)];
    // 묶음은 보도 많은 순으로 온다
    const clusters = [
      ...big,
      small[0],
      smallMorning[0],
      small[1],
      smallMorning[1],
      smallMorning[2],
    ];

    const picked = selectCandidates(clusters, 3, 2);

    expect(picked).toEqual([...big, smallMorning[0], smallMorning[1]]);
  });

  it('300개 가까운 날도 고르기 줄 수가 한도 + 아침 몫을 넘지 않는다 (11/8 · 11/9 요약 실패)', () => {
    const clusters = Array.from({ length: 298 }, (_, i) =>
      cluster(1, i % 3 === 0),
    );
    expect(selectCandidates(clusters).length).toBe(60);
  });
});
