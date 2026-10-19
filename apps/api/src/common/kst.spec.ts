import { kstDayRange, kstDaysAgo, toKstDate } from './kst';

/**
 * 크롤링은 매일 08:00 KST(= 전날 23:00 UTC)에 실행됩니다.
 * 이전 코드는 KST 0시를 구한 뒤 .utc(true)로 시각만 남긴 채 UTC로 바꿔, 범위가 9시간 늦게 밀렸습니다.
 * 그래서 D일 08:00 크롤링 결과가 D일 검색에서 빠지고 D-1일 범위에 들어갔습니다.
 */
describe('kstDayRange', () => {
  it('KST 하루 범위를 UTC 시각으로 정확히 만든다', () => {
    const { start, end } = kstDayRange('2026-10-19', '2026-10-19');
    expect(start.toISOString()).toBe('2026-10-18T15:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-19T14:59:59.999Z');
  });

  it('D일 08:00 KST 크롤링 결과는 D일 범위에 들어가고 D-1일 범위에는 없다', () => {
    const crawledAt = new Date('2026-10-18T23:00:00.000Z'); // 2026-10-19 08:00 KST
    const today = kstDayRange('2026-10-19', '2026-10-19');
    const yesterday = kstDayRange('2026-10-18', '2026-10-18');
    expect(crawledAt >= today.start && crawledAt <= today.end).toBe(true);
    expect(crawledAt >= yesterday.start && crawledAt <= yesterday.end).toBe(
      false,
    );
  });

  it('시각이 있는 값은 KST 날짜로 바꿔서 계산한다', () => {
    // 2026-10-18T23:00Z 는 KST로 10월 19일
    expect(toKstDate('2026-10-18T23:00:00.000Z')).toBe('2026-10-19');
    expect(toKstDate(new Date('2026-10-18T14:59:59.000Z'))).toBe('2026-10-18');
  });
});

describe('kstDaysAgo', () => {
  it('KST 기준으로 날짜를 뺀다 (UTC로는 아직 전날인 새벽)', () => {
    const now = new Date('2026-10-19T16:30:00.000Z'); // 2026-10-20 01:30 KST
    expect(kstDaysAgo(0, now)).toBe('2026-10-20');
    expect(kstDaysAgo(7, now)).toBe('2026-10-13');
  });
});
