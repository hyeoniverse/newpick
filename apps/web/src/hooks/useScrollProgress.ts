'use client';

import { useEffect, useRef } from 'react';

/**
 * - enter: 요소 윗변이 화면 아래에 닿을 때 0, 화면 위에서 20% 지점에 닿을 때 1 (나타나며 커지는 장면)
 * - through: 요소 윗변이 화면 아래 15% 지점에 닿을 때 0, 아랫변이 화면 가운데를 지날 때 1 (글자가 차례로 밝아지는 장면)
 * - pinned: 요소가 화면 위에 닿아 붙기 시작할 때 0, 붙은 채 다 지나갈 때 1 (sticky로 고정된 장면)
 */
export type ScrollProgressMode = 'enter' | 'through' | 'pinned';

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function progressOf(rect: DOMRect, vh: number, mode: ScrollProgressMode) {
	if (mode === 'enter') return clamp((vh - rect.top) / (vh * 0.8));
	if (mode === 'through') return clamp((vh * 0.85 - rect.top) / (rect.height + vh * 0.35));
	const distance = rect.height - vh;
	return distance > 0 ? clamp(-rect.top / distance) : rect.top <= 0 ? 1 : 0;
}

/**
 * 스크롤에 따라 요소가 얼마나 지나갔는지(0~1)를 CSS 변수 --progress로 요소에 바로 적는다.
 * 스크롤마다 React가 다시 그리지 않도록 상태가 아니라 style에 쓰고, 필요한 곳만 onProgress로 받는다
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>(
	mode: ScrollProgressMode,
	onProgress?: (progress: number) => void,
) {
	const ref = useRef<T>(null);
	const callback = useRef(onProgress);
	callback.current = onProgress;

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let frame = 0;
		const update = () => {
			frame = 0;
			const progress = progressOf(el.getBoundingClientRect(), window.innerHeight, mode);
			el.style.setProperty('--progress', progress.toFixed(4));
			callback.current?.(progress);
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};

		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			cancelAnimationFrame(frame);
		};
	}, [mode]);

	return ref;
}
