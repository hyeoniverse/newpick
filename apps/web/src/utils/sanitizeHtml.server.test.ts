// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

describe('sanitizeHtml (서버 렌더링)', () => {
	it('DOM이 없으면 정리할 수 없으므로 아무것도 렌더링하지 않는다 (fail closed)', () => {
		expect(sanitizeHtml('<p>본문</p><script>alert(1)</script>')).toBe('');
	});
});
