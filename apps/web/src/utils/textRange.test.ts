import { describe, expect, it } from 'vitest';
import { findTextRange } from './textRange';

describe('findTextRange (#123)', () => {
	it('문단을 넘어 고른 글도 공백 차이 없이 찾는다', () => {
		const root = document.createElement('div');
		root.innerHTML = '<p>코스피가 <strong>26일</strong> 하락했다.</p><p>외국인이 팔았다.</p>';
		const range = findTextRange(root, '하락했다.\n\n외국인이');
		expect(range?.toString()).toBe('하락했다.외국인이');
		expect(findTextRange(root, '코스피가 26일')?.toString()).toBe('코스피가 26일');
	});

	it('없는 글이면 null', () => {
		const root = document.createElement('div');
		root.textContent = '가나다';
		expect(findTextRange(root, '라마')).toBeNull();
		expect(findTextRange(root, '   ')).toBeNull();
	});
});
