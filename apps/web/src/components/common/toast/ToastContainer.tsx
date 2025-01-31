'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { ToastPosition } from '@/models/toast.model';
import { useMount } from '@/hooks/useMount';
import { useToast } from '@/hooks/useToast';

import styled from 'styled-components';
import Toast from '@/components/common/toast/Toast';

const ToastContainer = React.memo(() => {
	const { isMounted } = useMount();
	const { toasts, position } = useToast();

	if (!isMounted) return null;

	return createPortal(
		<StyledToastContainer $position={position}>
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
		document.body
	);
});

ToastContainer.displayName = 'ToastContainer';

export default ToastContainer;

interface StyledProps {
	$position: ToastPosition;
}

const StyledToastContainer = styled.div<StyledProps>`
	width: 100vw;
	position: fixed;
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
		};
		return positions[$position] || positions['center-bottom'];
	}}

	> div {
		transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
		pointer-events: auto;
	}
`;
