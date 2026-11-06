// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

describe('sanitizeHtml (서버 렌더링)', () => {
	it('DOM이 없는 서버에서도 브라우저와 같은 규칙으로 정리한다 (본문은 남기고 스크립트는 지움)', () => {
		expect(sanitizeHtml('<p>본문</p><script>alert(1)</script>')).toBe('<p>본문</p>');
	});

	it('새 탭 링크는 서버에서도 opener를 끊는다', () => {
		expect(sanitizeHtml('<a href="https://a.com" target="_top" rel="opener">x</a>')).toBe(
			'<a href="https://a.com" target="_blank" rel="noopener noreferrer">x</a>',
		);
	});
});
