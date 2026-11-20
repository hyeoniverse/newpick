/**
 * 테스트(jsdom)용 popover 흉내 (#313). jsdom은 [popover]를 늘 숨기고(display: none) showPopover가 없어,
 * top layer에 띄우는 시트 · 토스트 · 목록 안의 단추를 찾지 못한다. 열면 보이게(인라인 display) · :popover-open이 맞게만 한다
 */
const openPopovers = new WeakSet<Element>();

// node 환경 파일(서버 코드 테스트)에는 HTMLElement가 없다
if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover !== 'function') {
	HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
		openPopovers.add(this);
		this.style.setProperty('display', 'block');
	};
	HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
		openPopovers.delete(this);
		this.style.removeProperty('display');
	};
	const matches = Element.prototype.matches;
	Element.prototype.matches = function patchedMatches(this: Element, selector: string) {
		return selector === ':popover-open' ? openPopovers.has(this) : matches.call(this, selector);
	};
}

export {};
