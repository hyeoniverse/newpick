'use client';

import React, { useState } from 'react';
import useToastStore, { ToastItem } from '@/stores/toastStore';
import { useTimeout } from '@/hooks/useTimeout';

import styled from 'styled-components';
import Button from '@/components/common/Button';
import { FaCheck, FaInfoCircle } from 'react-icons/fa';
import { IoIosWarning } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';

const TOAST_REMOVE_DELAY = 300;

const Toast = React.memo(({ id, message, type }: ToastItem) => {
	const removeToast = useToastStore((state) => state.removeToast);
	const [isFadingOut, setIsFadingOut] = useState(false);

	const handleRemoveToast = () => {
		setIsFadingOut(true);
	};

	useTimeout(() => {
		setIsFadingOut(true);
	}, TOAST_REMOVE_DELAY);

	const handleAnimationEnd = () => {
		if (isFadingOut) {
			removeToast(id);
		}
	};

	return (
		<StyledToast className={`${isFadingOut ? 'fade-out' : 'fade-in'} ${type}`} onAnimationEnd={handleAnimationEnd}>
			<p>
				{type === 'info' && <FaInfoCircle />}
				{type === 'success' && <FaCheck />}
				{type === 'error' && <IoIosWarning />}
				{message}
			</p>
			<Button scheme="secondary" onClick={handleRemoveToast}>
				<IoClose />
			</Button>
		</StyledToast>
	);
});

Toast.displayName = 'Toast';

const StyledToast = styled.div`
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateX(1rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes fade-out {
		from {
			opacity: 1;
			transform: translateX(0);
		}
		to {
			opacity: 0;
			transform: translateX(1rem);
		}
	}

	&.fade-in {
		animation: fade-in 0.3s ease-in-out forwards;
	}

	&.fade-out {
		animation: fade-out 0.3s ease-in-out forwards;
	}

	&.info {
		color: ${({ theme }) => theme.color.text};
		background: ${({ theme }) => theme.color.surface};

		svg {
			color: ${({ theme }) => theme.color.text};

			&:hover {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	&.success {
		color: ${({ theme }) => theme.color.onPrimary};
		background: ${({ theme }) => theme.color.primary};

		svg {
			color: ${({ theme }) => theme.color.onPrimary};

			&:hover {
				color: ${({ theme }) => theme.color.text};
			}
		}
	}

	&.error {
		color: ${({ theme }) => theme.color.onError};
		background: ${({ theme }) => theme.color.error};

		svg {
			color: ${({ theme }) => theme.color.onError};

			&:hover {
				color: ${({ theme }) => theme.color.text};
			}
		}
	}

	background: ${({ theme }) => theme.color.surface};
	padding: 0.5rem 1.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.default};
	box-shadow: ${({ theme }) => theme.shadow.default};
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	opacity: 0;
	transition: all 0.3s ease-in-out;
	z-index: 9999;

	p {
		font-size: ${({ theme }) => theme.fontSize.small};
		margin: 0;
		flex: 1;

		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 0.5rem;
	}

	button {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		margin: 0;
		box-shadow: none;

		&:hover {
			background: transparent;
			color: ${({ theme }) => theme.color.primary};
			box-shadow: none;
			transform: rotate(90deg);
			transition: transform 0.3s ease;
		}
	}
`;

export default Toast;
