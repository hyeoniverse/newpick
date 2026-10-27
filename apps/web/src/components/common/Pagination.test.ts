import { describe, expect, it } from 'vitest';
import { pages } from '@/components/common/Pagination';

describe('Pagination 쪽 번호', () => {
	it('처음 · 끝 · 지금 앞뒤만, 사이는 …', () => {
		expect(pages(6, 12)).toEqual([1, '…', 5, 6, 7, '…', 12]);
		expect(pages(1, 12)).toEqual([1, 2, '…', 12]);
		expect(pages(12, 12)).toEqual([1, '…', 11, 12]);
	});

	it('쪽이 적으면 모두', () => {
		expect(pages(2, 3)).toEqual([1, 2, 3]);
	});
});
