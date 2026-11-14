import { useEffect, useRef, type RefObject } from 'react';

type Options = {
	/** 열려 있을 때만 듣는다 */
	open: boolean;
	/** 이 안을 누르면 닫지 않는다 (단추 · 띄운 목록 등) */
	refs: RefObject<HTMLElement | null>[];
	onClose: () => void;
	/** Esc로 닫기 (기본 켬). 'stop'이면 닫고 키 이벤트를 멈춰, 담고 있는 시트(모달)까지 닫히지 않게 한다 */
	escape?: boolean | 'stop';
	/** Esc로 닫은 뒤 할 일 (예: 여는 단추로 포커스 되돌리기) */
	afterEscape?: () => void;
	/**
	 * 스크롤하면 닫기 (화면 기준으로 띄운 목록이 어긋나지 않게)
	 * - 'outside': refs 밖(페이지 · 표)이 스크롤될 때. 목록 안 스크롤은 그대로
	 * - 숫자: 창이 그만큼(px) 넘게 스크롤될 때 (누를 때 생기는 작은 움직임은 무시)
	 */
	scroll?: 'outside' | number;
	/** 창 크기가 바뀌면 닫기 */
	resize?: boolean;
};

/**
 * 띄운 목록 · 메뉴 닫기 (#230): 바깥을 누르거나 Esc, 고르면 스크롤 · 창 크기 변경 때 onClose
 */
export function useDismiss({ open, refs, onClose, escape = true, afterEscape, scroll, resize = false }: Options) {
	// 그릴 때마다 새로 만든 함수여도 듣기를 다시 걸지 않게 최신 값만 들고 있는다
	const latest = useRef({ refs, onClose, afterEscape });
	latest.current = { refs, onClose, afterEscape };

	useEffect(() => {
		if (!open) return;
		const inside = (target: EventTarget | null) =>
			latest.current.refs.some((ref) => ref.current?.contains(target as Node));
		const close = () => latest.current.onClose();

		const onDown = (event: MouseEvent) => {
			if (!inside(event.target)) close();
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			if (escape === 'stop') event.stopPropagation();
			close();
			latest.current.afterEscape?.();
		};
		const openedAt = window.scrollY;
		const onScroll = (event: Event) => {
			if (scroll === 'outside') {
				if (!inside(event.target)) close();
			} else if (typeof scroll === 'number' && Math.abs(window.scrollY - openedAt) > scroll) close();
		};

		document.addEventListener('mousedown', onDown);
		if (escape) document.addEventListener('keydown', onKey);
		// 'outside'는 표 · 목록 같은 안쪽 스크롤도 잡도록 capture로 듣는다
		if (scroll !== undefined)
			window.addEventListener('scroll', onScroll, scroll === 'outside' ? true : { passive: true });
		if (resize) window.addEventListener('resize', close);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
			window.removeEventListener('scroll', onScroll, scroll === 'outside');
			window.removeEventListener('resize', close);
		};
	}, [open, escape, scroll, resize]);
}
