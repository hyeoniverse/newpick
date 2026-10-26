/** 화면에 실제로 보이는지 (접혀 있거나 투명하면 제외) */
const isShown = (el: Element) => {
	const rect = el.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) return false;
	const style = getComputedStyle(el);
	return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.05;
};

/**
 * 헤더와, 헤더에서 펼쳐진 영역(프로필 메뉴·모바일 메뉴·아래 메뉴의 .panel)의 아래 끝 (px).
 * 헤더가 스크롤로 접혀 있으면 화면 위로 올라가 0에 가깝다
 */
export function headerBottom(): number {
	const header = document.querySelector('header');
	if (!header) return 0;
	const shown = [header, ...header.querySelectorAll('.panel')].filter(isShown);
	return Math.max(0, ...shown.map((el) => el.getBoundingClientRect().bottom));
}
