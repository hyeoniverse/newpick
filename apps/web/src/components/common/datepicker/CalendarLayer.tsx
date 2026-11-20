'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * 달력을 띄우는 층 (react-datepicker의 popperContainer). 화면 전체를 덮는 투명한 popover를 top layer에 올리고
 * 그 안에 달력을 그린다 (#313). top layer는 시트 · 붙는 머리 · 카드의 쌓임 순서보다 늘 위라 z-index가 필요 없다.
 * - 층은 클릭을 받지 않고(pointer-events: none) 달력만 받는다. 바깥을 누르면 뒤 화면 · react-datepicker의 닫기로 그대로 간다
 * - 층이 화면 전체(fixed, inset 0)라 react-datepicker(floating-ui)가 잡는 자리가 곧 화면 좌표다
 * - popover를 모르는 브라우저에서는 예전처럼 body 아래 층으로 그린다
 */
export default function CalendarLayer({ children }: { children?: React.ReactNode }) {
	// 서버 화면과 맞추려고 브라우저에 붙은 뒤에만 띄운다 (달력은 누른 뒤에야 열리므로 늦어도 괜찮다)
	const [mounted, setMounted] = useState(false);
	const layerRef = useRef<HTMLDivElement>(null);
	useEffect(() => setMounted(true), []);
	const visible = mounted && !!children;

	useLayoutEffect(() => {
		const layer = layerRef.current;
		if (!visible || !layer || typeof layer.showPopover !== 'function') return;
		if (!layer.matches(':popover-open')) layer.showPopover();
		return () => {
			if (layer.matches(':popover-open')) layer.hidePopover();
		};
	}, [visible]);

	if (!visible) return null;
	return createPortal(
		<div ref={layerRef} popover="manual" className="np-calendar-layer">
			{children}
		</div>,
		document.body,
	);
}
