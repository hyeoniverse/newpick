import { describe, expect, it } from 'vitest';
import { inRange, toDate, toValue } from './shared';

describe('toDate · toValue', () => {
	it("'YYYY-MM-DD'를 그날(로컬 0시)로, 다시 같은 글자로", () => {
		const date = toDate('2026-02-28')!;
		expect([date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours()]).toEqual([2026, 2, 28, 0]);
		expect(toValue(date)).toBe('2026-02-28');
	});

	it("모양이 아니거나 비면 null, Date가 없으면 ''", () => {
		expect(toDate('2026-2-28')).toBeNull();
		expect(toDate('')).toBeNull();
		expect(toDate(null)).toBeNull();
		expect(toValue(null)).toBe('');
	});
});

describe('inRange', () => {
	it('min · max를 포함하고, 없는 쪽은 열려 있다', () => {
		expect(inRange('2026-11-10', '2026-11-01', '2026-11-10')).toBe(true);
		expect(inRange('2026-10-31', '2026-11-01', '2026-11-10')).toBe(false);
		expect(inRange('2026-11-11', undefined, '2026-11-10')).toBe(false);
		expect(inRange('1999-01-01')).toBe(true);
	});
});
