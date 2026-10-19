import DOMPurify from 'dompurify';

/**
 * 서버(AI)가 만든 HTML을 화면에 넣기 전에 스크립트·이벤트 핸들러·javascript: 링크를 제거합니다.
 * DOMPurify는 브라우저 DOM이 필요하므로, 서버 렌더링 중에는 아무것도 렌더링하지 않습니다(fail closed).
 * 현재 기사 본문과 체험 결과는 모두 브라우저에서 조회한 뒤 렌더링됩니다.
 */
export function sanitizeHtml(html: string): string {
	if (typeof window === 'undefined') return '';
	return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
