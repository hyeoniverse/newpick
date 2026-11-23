import { describe, expect, it } from 'vitest';
import { rowSteps } from './useInOut';

describe('등장 차례 (화면 높이 순서)', () => {
	it('위에 있는 것이 먼저, 같은 줄(24px 안)은 같은 차례, 순서가 섞여 있어도 높이로', () => {
		// 카드 세 장 한 줄(100 · 104 · 98) → 다음 줄(400 · 402) → 그 아래(700)
		expect(rowSteps([400, 100, 104, 700, 98, 402])).toEqual([1, 0, 0, 2, 0, 1]);
	});

	it('차례는 8단계까지 (그 뒤는 같은 때)', () => {
		expect(rowSteps(Array.from({ length: 12 }, (_, i) => i * 100)).at(-1)).toBe(8);
	});
});
