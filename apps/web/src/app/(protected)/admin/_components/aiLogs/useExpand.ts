'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/** 줄 수만큼 접힌 글을 펼치고 접는다: 높이를 재서 움직이고, 다 접힌 뒤에만 말줄임('…')을 붙인다 */
export function useExpand(open: boolean) {
	const ref = useRef<HTMLSpanElement>(null);
	const [clamped, setClamped] = useState(!open);
	const mounted = useRef(false);
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (!mounted.current) {
			mounted.current = true;
			return;
		}
		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (open) {
			setClamped(false);
			if (still) {
				el.style.maxHeight = 'none';
				return;
			}
			// 말줄임을 걷은 다음 프레임에 전체 높이를 재서 그만큼 늘린다
			requestAnimationFrame(() => {
				el.style.maxHeight = `${el.scrollHeight}px`;
			});
		} else {
			if (still) {
				el.style.maxHeight = '';
				setClamped(true);
				return;
			}
			// 지금 높이에서 시작해 접힌 높이(CSS)로 줄인다
			el.style.maxHeight = `${el.scrollHeight}px`;
			void el.offsetHeight;
			el.style.maxHeight = '';
		}
	}, [open]);
	const onTransitionEnd = (event: React.TransitionEvent) => {
		if (event.propertyName !== 'max-height' || !ref.current) return;
		if (open) ref.current.style.maxHeight = 'none';
		else setClamped(true);
	};
	return { ref, clamped, onTransitionEnd };
}
