'use client';

import React, { useState, useEffect } from 'react';
import { TOAST } from '@/constants/numbers';
import { ToastItem, ToastPosition, ToastType } from '@/models/toast.model';
import { useToast } from '@/hooks/useToast';

import styled from 'styled-components';
import Button from '@/components/common/Button';
import { FaCheck, FaInfoCircle } from 'react-icons/fa';
import { IoIosWarning } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';

const Toast = React.memo(({ id, message, type, duration = TOAST.DURATION, index }: ToastItem & { index: number }) => {
	const { removeToast, position } = useToast();
	const [isFadingOut, setIsFadingOut] = useState(false);
	const [progress, setProgress] = useState(100); // ⏳ 프로그레스 바 (100% → 0%)
	const [isPaused, setIsPaused] = useState(false); // hover 상태 추적

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (!isPaused) {
			interval = setInterval(() => {
				setProgress((prev) => Math.max(prev - 100 / (duration / 100), 0)); // 100ms마다 감소
			}, 100);
		}
		return () => clearInterval(interval);
	}, [duration, isPaused]);

	useEffect(() => {
		let timer: NodeJS.Timeout;
		if (!isPaused) {
			timer = setTimeout(startFadeOut, duration);
		}
		return () => clearTimeout(timer);
	}, [duration, isPaused]);

	// hover 중일 때 타이머 멈추기
	const handleMouseEnter = () => setIsPaused(true);
	const handleMouseLeave = () => setIsPaused(false);

	// fade-out 시작
	const startFadeOut = () => setIsFadingOut(true);

	// Fade-out 애니메이션이 끝난 후 제거
	const handleAnimationEnd = () => {
		if (isFadingOut) {
			removeToast(id);
		}
	};

	return (
		<StyledToast
			className={`${isFadingOut ? 'fade-out' : 'fade-in'} ${type}`}
			$type={type}
			$position={position}
			$index={index}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onAnimationEnd={handleAnimationEnd}
		>
			<p>
				{type === 'info' && <FaInfoCircle />}
				{type === 'success' && <FaCheck />}
				{type === 'warning' && <IoIosWarning />}
				{type === 'error' && <IoIosWarning />}
				{message}
			</p>
			<Button scheme="secondary" onClick={startFadeOut} icon={<IoClose />} />
			<ProgressBar $type={type} $progress={progress} />
		</StyledToast>
	);
});

interface StyledProps {
	$type: ToastType;
	$position: ToastPosition;
	$index: number;
}

const StyledToast = styled.div<StyledProps>`
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(${(props) => (props.$position.includes('top') ? '-20px' : '20px')}) scaleY(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scaleY(1);
		}
	}

	@keyframes fade-out {
		from {
			opacity: 1;
			transform: translateY(0) scaleY(1);
			max-height: 100px;
			margin-bottom: 0.5rem;
		}
		to {
			opacity: 0;
			transform: translateY(${(props) => (props.$position.includes('top') ? '-20px' : '20px')}) scaleY(0);
			max-height: 0px;
			margin-bottom: 0px;
		}
	}

	position: relative;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 1.5rem;
	margin: 0.5rem;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.borderRadius.default};
	box-shadow: ${({ theme }) => theme.shadow.default};
	gap: 1rem;
	transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out, max-height 0.3s ease-in-out,
		margin-bottom 0.3s ease-in-out;
	transform: translateY(${({ $index }) => -$index * 5}px);
	opacity: 1;
	overflow: hidden;

	background: ${({ theme }) => theme.color.surface};
	color: ${({ theme, $type }) =>
		$type === 'info' || $type === 'success' || $type === 'error' ? theme.color.text : theme.color.text};

	&.fade-in {
		animation: fade-in 0.3s ease-in-out forwards;
	}

	&.fade-out {
		animation: fade-out 0.3s ease-in-out forwards;
	}

	p {
		font-size: ${({ theme }) => theme.fontSize.small};
		display: flex;
		align-items: center;
		gap: 0.5rem;

		svg {
			color: ${({ theme, $type }) =>
				$type === 'info'
					? theme.color.primary
					: $type === 'success'
					? theme.color.success
					: $type === 'warning'
					? theme.color.warning
					: theme.color.error};
		}
	}

	button {
		aspect-ratio: 1;
		width: 1.5rem;
		background: transparent;
		border: none;
		cursor: pointer;

		svg {
			transition: transform 0.3s ease-in-out;
			transform: rotate(0deg);
		}

		&:hover {
			background: transparent;

			svg {
				transform: rotate(90deg);
				color: ${({ theme, $type }) =>
					$type === 'info'
						? theme.color.primary
						: $type === 'success'
						? theme.color.success
						: $type === 'warning'
						? theme.color.warning
						: theme.color.error};
			}
		}
	}
`;

interface ProgressProps {
	$type: ToastType;
	$progress: number;
}

const ProgressBar = styled.div.attrs<ProgressProps>(({ $progress, theme, $type }) => ({
	style: {
		width: `${$progress}%`,
		background:
			$type === 'info'
				? theme.color.primary
				: $type === 'success'
				? theme.color.success
				: $type === 'warning'
				? theme.color.warning
				: theme.color.error,
	},
}))<ProgressProps>`
	position: absolute;
	bottom: 0;
	left: 0;
	height: 4px;
	transition: width 0.1s linear;
`;

Toast.displayName = 'Toast';
export default Toast;
