'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ToastPosition } from '@/models/toast.model';
import { useMount } from '@/hooks/useMount';
import { useToast } from '@/hooks/useToast';
import { headerBottom } from '@/utils/headerBottom';

import { cx } from '@/styles/tw';
import Toast from '@/components/common/toast/Toast';

const POSITION: Record<ToastPosition, string> = {
	'top-left': 'top-4 left-4 items-start',
	'top-right': 'top-4 right-4 items-end',
	'bottom-left': 'bottom-4 left-4 items-start',
	'bottom-right': 'bottom-4 right-4 items-end',
	'center-bottom': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
	'center-top': 'top-4 left-1/2 -translate-x-1/2 items-center',
};

/** 헤더(또는 펼친 메뉴)와 토스트 사이 간격 */
const GAP = 12;

const ToastContainer = React.memo(() => {
	const { isMounted } = useMount();
	const { toasts, position } = useToast();
	const containerRef = useRef<HTMLDivElement>(null);
	const isTop = position.includes('top');

	// 위쪽 토스트는 헤더와 펼친 메뉴(프로필·모바일 메뉴·아래 메뉴) 아래에 둔다.
	// 헤더는 스크롤로 접히고 메뉴는 애니메이션으로 펼쳐지므로, 토스트가 떠 있는 동안 매 프레임 잰다
	useEffect(() => {
		if (!isMounted || !isTop || !toasts.length) return;
		let frame = 0;
		const follow = () => {
			if (containerRef.current) containerRef.current.style.top = `${Math.round(headerBottom()) + GAP}px`;
			frame = requestAnimationFrame(follow);
		};
		follow();
		const container = containerRef.current;
		return () => {
			cancelAnimationFrame(frame);
			// 아래쪽 위치로 바꿨을 때 남은 top이 방해하지 않게
			if (container) container.style.top = '';
		};
	}, [isMounted, isTop, toasts.length]);

	if (!isMounted) return null;

	return createPortal(
		<div
			ref={containerRef}
			// left: 50%로 두면 남은 폭(화면 절반)에 맞춰 줄어들어 짧은 문구도 꺾인다. 내용 폭에 맞춘다
			className={cx(
				'pointer-events-none fixed z-[9999] flex w-max max-w-[calc(100vw-2rem)] flex-col gap-2 [&>div]:pointer-events-auto',
				POSITION[position] ?? POSITION['center-top'],
			)}
		>
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					id={toast.id}
					message={toast.message}
					type={toast.type}
					duration={toast.duration}
					action={toast.action}
					index={toasts.findIndex((t) => t.id === toast.id)}
				/>
			))}
		</div>,
		document.body,
	);
});

ToastContainer.displayName = 'ToastContainer';

export default ToastContainer;
