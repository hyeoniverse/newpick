import { afterEach, describe, expect, it } from 'vitest';
import { kstDate } from '@/utils/formatter';

const ORIGINAL_TZ = process.env.TZ;

afterEach(() => {
	process.env.TZ = ORIGINAL_TZ;
});

describe('kstDate', () => {
	it.each([
		// [UTC 시각, KST 오늘, KST 어제]
		['2026-10-25T16:00:00Z', '2026-10-26', '2026-10-25'], // KST 10/26 01:00
		['2026-10-25T14:59:59Z', '2026-10-25', '2026-10-24'], // KST 10/25 23:59
		['2026-01-01T00:30:00Z', '2026-01-01', '2025-12-31'], // KST 1/1 09:30, 연도 경계
	])('%s → 오늘 %s, 어제 %s', (iso, today, yesterday) => {
		const now = new Date(iso);
		expect(kstDate(0, now)).toBe(today);
		expect(kstDate(1, now)).toBe(yesterday);
	});

	it.each(['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati'])('브라우저 시간대가 %s여도 KST 기준 날짜', (tz) => {
		process.env.TZ = tz;
		expect(kstDate(1, new Date('2026-10-25T16:00:00Z'))).toBe('2026-10-25');
	});

	// #28: 로캘 문자열('2026. 10. 24.')을 다시 파싱하면 Safari에서 Invalid Date가 되어 api가 400을 돌려줬다
	it('api의 @IsDateString()이 받는 YYYY-MM-DD 형식', () => {
		const date = kstDate(1, new Date('2026-10-25T16:00:00Z'));
		expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(Number.isNaN(new Date(date).getTime())).toBe(false);
	});
});
