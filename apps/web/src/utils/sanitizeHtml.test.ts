import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

// 1단계(#3) XSS 수정 때 손으로 확인한 입력 표를 그대로 옮겼습니다.
describe('sanitizeHtml', () => {
	it('본문에 쓰는 태그와 일반 링크는 남긴다', () => {
		const html = '<h2>제목</h2><p>본문 <a href="https://news.naver.com/a">원문</a></p>';
		expect(sanitizeHtml(html)).toBe(html);
	});

	it.each([
		['<img src="x" onerror="alert(1)">', 'onerror'],
		['<p>본문</p><script>alert(1)</script>', '<script'],
		['<a href="javascript:alert(1)">링크</a>', 'javascript:'],
		['<svg><animate onbegin="alert(1)" attributeName="x" dur="1s"></animate></svg>', 'onbegin'],
		['<iframe src="https://example.com"></iframe>', '<iframe'],
	])('%s에서 %s를 제거한다', (input, dangerous) => {
		const result = sanitizeHtml(input);
		expect(result).not.toContain(dangerous);
	});

	it('형광펜 강조(<mark>)는 남긴다 (#51)', () => {
		expect(sanitizeHtml('<p>코스피가 <mark>1.46%</mark> 내렸다</p>')).toBe('<p>코스피가 <mark>1.46%</mark> 내렸다</p>');
	});

	it('새 탭 링크는 남기되 항상 opener를 끊는다 (출처 링크)', () => {
		expect(sanitizeHtml('<a href="https://n.news.naver.com/a" target="_blank">KBS</a>')).toBe(
			'<a href="https://n.news.naver.com/a" target="_blank" rel="noopener noreferrer">KBS</a>',
		);
		expect(sanitizeHtml('<a href="https://a.com" target="_top" rel="opener">x</a>')).toBe(
			'<a href="https://a.com" target="_blank" rel="noopener noreferrer">x</a>',
		);
	});

	it('스크립트를 지워도 주변 본문은 남긴다', () => {
		expect(sanitizeHtml('<p>본문</p><script>alert(1)</script>')).toBe('<p>본문</p>');
	});
});
