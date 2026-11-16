import { describe, expect, it } from 'vitest';
import { byMonth, dayLabel, monthLabel, monthOf } from './months';

describe('monthOf · dayLabel (한국 시각)', () => {
	it('UTC 15시부터는 한국 다음 날 · 다음 달', () => {
		expect(monthOf('2026-10-31T14:59:00Z')).toBe('2026-10');
		expect(monthOf('2026-10-31T15:00:00Z')).toBe('2026-11');
		expect(dayLabel('2026-10-27T03:00:00Z')).toBe('27일');
		expect(dayLabel('2026-10-31T15:00:00Z')).toBe('1일');
	});
});

describe('monthLabel', () => {
	it("'YYYY-MM' → 'YYYY년 M월' (앞 0 없이)", () => {
		expect(monthLabel('2026-10')).toBe('2026년 10월');
		expect(monthLabel('2026-03')).toBe('2026년 3월');
	});
});

describe('byMonth', () => {
	it('목록 순서 그대로, 이어진 같은 달만 한 묶음', () => {
		const items = [
			{ id: 1, at: '2026-11-02T00:00:00Z' },
			{ id: 2, at: '2026-10-31T16:00:00Z' },
			{ id: 3, at: '2026-10-20T00:00:00Z' },
			{ id: 4, at: '2026-09-30T00:00:00Z' },
		];
		expect(byMonth(items, (i) => i.at).map((g) => [g.month, g.items.map((i) => i.id)])).toEqual([
			['2026-11', [1, 2]],
			['2026-10', [3]],
			['2026-09', [4]],
		]);
		expect(byMonth([], (i: { at: string }) => i.at)).toEqual([]);
	});
});
