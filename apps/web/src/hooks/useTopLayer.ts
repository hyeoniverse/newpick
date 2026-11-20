import { useLayoutEffect, type RefObject } from 'react';

type Options = {
	/** 열려 있을 때만 top layer에 올리고 자리를 맞춘다 */
	open: boolean;
	/** 붙일 기준 (여는 단추 · 칸) */
	anchorRef: RefObject<HTMLElement | null>;
	/** popover="manual"을 단 띄울 요소 */
	panelRef: RefObject<HTMLElement | null>;
	/** 기준과 띄운 요소 사이 (px) */
	gap?: number;
	/** 기준의 왼쪽(start) · 오른쪽(end) 끝에 맞춘다 */
	align?: 'start' | 'end';
	/** 아래 자리가 모자라면 위로 (기본 켬). 'up'이면 늘 위로 */
	vertical?: 'auto' | 'up';
	/** 폭을 기준과 같게 ('exact') · 적어도 기준만큼 ('min') */
	width?: 'exact' | 'min';
};

/** 화면 가장자리에서 띄울 최소 여백 (px) */
const EDGE = 8;

/** 이 브라우저가 popover를 아는지 (jsdom · 오래된 브라우저는 모른다 → 예전처럼 제자리에 그린다) */
const supportsPopover = (el: HTMLElement) => typeof el.showPopover === 'function';

/**
 * 떠 있는 목록 · 메뉴를 브라우저 top layer에 올리고 기준 옆에 붙인다 (#313).
 * top layer는 페이지의 어떤 z-index · overflow: hidden · 쌓임 맥락보다도 위에 그려져, z-index로 겨룰 일이 없다.
 * - 띄울 요소에 popover="manual"을 단다. 닫기(바깥 누름 · Esc)는 지금처럼 useDismiss가 맡는다
 *   (auto의 light dismiss와 겹치지 않게)
 * - top layer는 화면 기준(fixed)이라 원래 자리에서 떨어진다. 열려 있는 동안 기준이 움직이면 그 옆으로 자리를 다시 잡는다
 */
export function useTopLayer({
	open,
	anchorRef,
	panelRef,
	gap = 4,
	align = 'start',
	vertical = 'auto',
	width,
}: Options) {
	useLayoutEffect(() => {
		const panel = panelRef.current;
		const anchor = anchorRef.current;
		if (!open || !panel || !anchor || !supportsPopover(panel)) return;
		if (!panel.matches(':popover-open')) panel.showPopover();

		const place = () => {
			const rect = anchor.getBoundingClientRect();
			if (width === 'exact') panel.style.width = `${rect.width}px`;
			if (width === 'min') panel.style.minWidth = `${rect.width}px`;
			const { offsetWidth, offsetHeight } = panel;
			const below = window.innerHeight - rect.bottom;
			const up = vertical === 'up' || (below < offsetHeight + gap + EDGE && rect.top > below);
			panel.style.top = `${up ? Math.max(EDGE, rect.top - gap - offsetHeight) : rect.bottom + gap}px`;
			const left = align === 'end' ? rect.right - offsetWidth : rect.left;
			panel.style.left = `${Math.max(EDGE, Math.min(left, window.innerWidth - offsetWidth - EDGE))}px`;
			panel.dataset.side = up ? 'top' : 'bottom';
		};
		// 기준이 움직이면(페이지 · 표 · 시트 스크롤, 위쪽 내용이 늘거나 줄어듦, 창 크기) 따라간다.
		// 스크롤 이벤트만 들으면 스크롤 없이 위쪽 배치가 바뀔 때 어긋나서, 열려 있는 동안 프레임마다 기준 자리를 비교한다
		let last = '';
		let frame = 0;
		const follow = () => {
			const { top, left, width: w, height } = anchor.getBoundingClientRect();
			// 띄운 요소 크기도 본다: 위로 연 메뉴가 늘어나면(새 폴더 입력칸) 아래 끝을 단추에 다시 맞추게
			const now = `${top},${left},${w},${height},${panel.offsetWidth},${panel.offsetHeight},${window.innerWidth},${window.innerHeight}`;
			if (now !== last) {
				last = now;
				place();
			}
			frame = requestAnimationFrame(follow);
		};
		follow();
		return () => {
			cancelAnimationFrame(frame);
			if (panel.matches(':popover-open')) panel.hidePopover();
		};
	}, [open, anchorRef, panelRef, gap, align, vertical, width]);
}
