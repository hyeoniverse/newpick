import { afterEach, describe, expect, it } from 'vitest';
import { dateFormatter, kstDate, kstDateOf, monthDay, pad2 } from '@/utils/formatter';

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

describe('kstDateOf · monthDay · pad2', () => {
	it('그 순간의 한국 날짜: UTC 15시는 한국 다음 날 0시', () => {
		expect(kstDateOf('2026-10-31T14:59:00Z')).toBe('2026-10-31');
		expect(kstDateOf('2026-10-31T15:00:00Z')).toBe('2026-11-01');
		expect(kstDateOf(new Date('2026-01-01T00:00:00+09:00'))).toBe('2026-01-01');
	});

	it("'10월 31일' (한국 시각 기준)", () => {
		expect(monthDay('2026-10-31T03:00:00Z')).toBe('10월 31일');
		expect(monthDay('2026-10-31T15:00:00Z')).toBe('11월 1일');
	});

	it('두 자리로', () => {
		expect([pad2(0), pad2(7), pad2(12)]).toEqual(['00', '07', '12']);
	});
});

describe('dateFormatter', () => {
	// #292: 서버(UTC)와 브라우저(KST)가 다른 날짜를 그려 하이드레이션이 어긋났다
	it.each(['UTC', 'Asia/Seoul', 'America/Los_Angeles'])('실행하는 곳의 시간대가 %s여도 한국 날짜', (tz) => {
		process.env.TZ = tz;
		expect(dateFormatter('2026-11-07T21:40:00Z')).toBe('2026-11-08'); // KST 11/8 06:40
		expect(dateFormatter('2026-11-07T14:00:00Z')).toBe('2026-11-07'); // KST 11/7 23:00
	});

	it('값이 없으면 오늘, 잘못된 값은 예전처럼 Invalid Date', () => {
		expect(dateFormatter(undefined)).toBe(kstDate());
		expect(dateFormatter('not-a-date')).toBe('Invalid Date');
	});
});
