import { kstStamp } from 'src/common/kst';
import { backfillAt, MORNING_START_HOUR, summaryWindow } from './schedule';

describe('예약 시각 계산', () => {
  it('요약 범위: 어제 수집 시각 ~ 지금, 아침 속보는 오늘 MORNING_START_HOUR시부터', () => {
    const now = new Date('2026-11-06T08:30:00+09:00');
    const window = summaryWindow({ hour: 8, minute: 0 }, now);
    expect(kstStamp(window.start)).toBe('2026-11-05 08:00:00');
    expect(window.end).toBe(now);
    expect(kstStamp(window.morningSince)).toBe(
      `2026-11-06 ${String(MORNING_START_HOUR).padStart(2, '0')}:00:00`,
    );
  });
  it('다시 만들 날: 오늘은 평소처럼, 지난 날은 그날 요약 시각, 앞날 · 기사가 지워진 날은 거절', () => {
    const now = new Date('2026-11-09T14:00:00+09:00');
    const summary = { hour: 8, minute: 30 };
    expect(kstStamp(backfillAt('2026-11-08', summary, now))).toBe(
      '2026-11-08 08:30:00',
    );
    expect(() => backfillAt('2026-11-09', summary, now)).toThrow();
    expect(() => backfillAt('2026-11-10', summary, now)).toThrow();
    expect(() => backfillAt('2026-10-01', summary, now)).toThrow();
  });
});
