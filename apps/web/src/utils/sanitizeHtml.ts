import DOMPurify from 'isomorphic-dompurify';

let hooked = false;

/** 새 탭으로 여는 링크는 항상 opener를 끊는다 (출처 링크, #48) */
function forceSafeNewTab() {
	if (hooked) return;
	hooked = true;
	DOMPurify.addHook('afterSanitizeAttributes', (node) => {
		if (node.tagName === 'A' && node.hasAttribute('target')) {
			node.setAttribute('target', '_blank');
			node.setAttribute('rel', 'noopener noreferrer');
		}
	});
}

/**
 * 서버(AI)가 만든 HTML을 화면에 넣기 전에 스크립트·이벤트 핸들러·javascript: 링크를 제거합니다.
 * 서버 렌더링에서도 같은 규칙으로 정리합니다(isomorphic-dompurify: 서버는 jsdom, 브라우저는 실제 DOM).
 * 상세 화면은 서버가 본문을 먼저 그리므로, 서버와 브라우저의 결과가 같아야 hydration이 어긋나지 않습니다.
 */
export function sanitizeHtml(html: string): string {
	forceSafeNewTab();
	return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ['target'] });
}
