/**
 * popover="manual"을 단 요소를 브라우저 top layer에 올리고 내리는 도구 (#313).
 * top layer는 나중에 올린 것이 위라, z-index 없이 "연 순서"대로 쌓인다 (시트 → 그 안의 시간 목록 → 토스트).
 * popover를 모르는 브라우저(jsdom 포함)에서는 아무것도 하지 않는다
 */
const canPopover = (el: HTMLElement): el is HTMLElement & { showPopover(): void; hidePopover(): void } =>
	typeof el.showPopover === 'function';

/** 올린다 (이미 올라가 있으면 그대로). 그릴 때 바로 올리려면 ref로 넘긴다: ref={showInTopLayer} */
export function showInTopLayer(el: HTMLElement | null) {
	if (el && canPopover(el) && !el.matches(':popover-open')) el.showPopover();
}

/** 내린다 */
export function hideFromTopLayer(el: HTMLElement | null) {
	if (el && canPopover(el) && el.matches(':popover-open')) el.hidePopover();
}

/**
 * 맨 위로 다시 올린다 (내렸다가 올림). 이미 떠 있는 것 위에 나중에 열린 시트가 있을 때.
 * 내리는 순간 안에 있던 포커스(막 열린 메모 입력칸 등)가 빠지므로 되돌려 준다
 */
export function raiseInTopLayer(el: HTMLElement | null) {
	if (!el || !canPopover(el)) return;
	const active = document.activeElement;
	hideFromTopLayer(el);
	showInTopLayer(el);
	if (active instanceof HTMLElement && el.contains(active)) active.focus({ preventScroll: true });
}
