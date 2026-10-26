'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ToastPosition } from '@/models/toast.model';
import { useMount } from '@/hooks/useMount';
import { useToast } from '@/hooks/useToast';
import { headerBottom } from '@/utils/headerBottom';

import styled from 'styled-components';
import Toast from '@/components/common/toast/Toast';

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
		<StyledToastContainer ref={containerRef} $position={position}>
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					id={toast.id}
					message={toast.message}
					type={toast.type}
					index={toasts.findIndex((t) => t.id === toast.id)}
				/>
			))}
		</StyledToastContainer>,
		document.body,
	);
});

ToastContainer.displayName = 'ToastContainer';

export default ToastContainer;

interface StyledProps {
	$position: ToastPosition;
}

const StyledToastContainer = styled.div<StyledProps>`
	position: fixed;
	/* left: 50%로 두면 남은 폭(화면 절반)에 맞춰 줄어들어 짧은 문구도 꺾인다. 내용 폭에 맞춘다 */
	width: max-content;
	max-width: calc(100vw - 2rem);
	z-index: 9999;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	pointer-events: none;

	${({ $position }) => {
		const positions = {
			'top-left': `
				top: 1rem;
				left: 1rem;
				align-items: flex-start;
			`,
			'top-right': `
				top: 1rem;
				right: 1rem;
				align-items: flex-end;
			`,
			'bottom-left': `
				bottom: 1rem;
				left: 1rem;
				align-items: flex-start;
			`,
			'bottom-right': `
				bottom: 1rem;
				right: 1rem;
				align-items: flex-end;
			`,
			'center-bottom': `
				bottom: 1rem;
				left: 50%;
				transform: translateX(-50%);
				align-items: center;
			`,
			'center-top': `
				top: 1rem;
				left: 50%;
				transform: translateX(-50%);
				align-items: center;
			`,
		};
		return positions[$position] || positions['center-top'];
	}}

	> div {
		pointer-events: auto;
	}
`;
