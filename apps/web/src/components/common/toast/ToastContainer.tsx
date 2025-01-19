'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import useToastStore from '@/stores/toastStore';
import styled from 'styled-components';
import Toast from '@/components/common/toast/Toast';

const ToastContainer = React.memo(() => {
	const toasts = useToastStore((state) => state.toasts);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	return createPortal(
		<StyledToastContainer>
			{toasts.map((toast) => (
				<Toast key={toast.id} id={toast.id} message={toast.message} type={toast.type} />
			))}
		</StyledToastContainer>,
		document.body // 브라우저 환경에서만 접근
	);
});

ToastContainer.displayName = 'ToastContainer';

const StyledToastContainer = styled.div`
	pointer-events: none;
	width: 100vw;
	height: 100vh;

	position: fixed;
	top: 32px;
	right: 24px;
	z-index: 9999;

	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-end;

	gap: 12px;
`;

export default ToastContainer;
