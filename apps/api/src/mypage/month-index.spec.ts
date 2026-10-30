import { monthIndex } from './mypage.service';

describe('받은 메일 달 이동 (#123)', () => {
  // 한국 시각 오전 8:40 = UTC 전날 23:40
  const sent = [
    '2026-09-23T23:40:00Z', // 9월 24일
    '2026-10-26T23:40:00Z', // 10월 27일
    '2026-09-30T23:40:00Z', // 10월 1일 (UTC로는 9월이지만 한국 시각으로 10월)
    '2026-10-20T23:40:00Z', // 10월 21일
  ].map((d) => new Date(d));

  it('최신순: 달마다 통수와 그 달 첫 메일의 순번, 달은 한국 시각으로', () => {
    expect(monthIndex(sent, 'desc')).toEqual([
      { month: '2026-10', count: 3, firstIndex: 0 },
      { month: '2026-09', count: 1, firstIndex: 3 },
    ]);
  });

  it('오래된순이면 옛 달부터', () => {
    expect(monthIndex(sent, 'asc')).toEqual([
      { month: '2026-09', count: 1, firstIndex: 0 },
      { month: '2026-10', count: 3, firstIndex: 1 },
    ]);
  });
});
