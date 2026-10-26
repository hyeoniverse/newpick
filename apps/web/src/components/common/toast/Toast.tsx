'use client';

import React, { useState, useEffect } from 'react';
import { TOAST } from '@/constants/numbers';
import { ToastItem, ToastPosition, ToastType } from '@/models/toast.model';
import { useToast } from '@/hooks/useToast';

import styled, { DefaultTheme } from 'styled-components';
import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert, LuX } from 'react-icons/lu';

const ICONS: Record<ToastType, React.ReactNode> = {
	info: <LuInfo />,
	success: <LuCircleCheck />,
	warning: <LuTriangleAlert />,
	error: <LuCircleX />,
};

const typeColor = (theme: DefaultTheme, type: ToastType) =>
	({
		info: theme.color.primary,
		success: theme.color.success,
		warning: theme.color.warning,
		error: theme.color.error,
	})[type];

const Toast = React.memo(({ id, message, type, duration = TOAST.DURATION }: ToastItem & { index: number }) => {
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
			className={isFadingOut ? 'fade-out' : 'fade-in'}
			// 오류는 바로 읽히게(alert), 나머지는 하던 일을 끊지 않게(status)
			role={type === 'error' ? 'alert' : 'status'}
			$type={type}
			$position={position}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onAnimationEnd={handleAnimationEnd}
		>
			<span className="icon">{ICONS[type]}</span>
			<p>{message}</p>
			<button type="button" className="close" onClick={startFadeOut} aria-label="알림 닫기">
				<LuX />
			</button>
			<ProgressBar $type={type} $progress={progress} />
		</StyledToast>
	);
});

interface StyledProps {
	$type: ToastType;
	$position: ToastPosition;
}

/** 위쪽에 뜨는 토스트는 위에서, 아래쪽은 아래에서 들어온다 */
const enterFrom = ({ $position }: StyledProps) => ($position.includes('top') ? '-12px' : '12px');

const StyledToast = styled.div<StyledProps>`
	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(${enterFrom}) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes toast-out {
		from {
			opacity: 1;
			max-height: 6rem;
		}
		to {
			opacity: 0;
			transform: translateY(${enterFrom}) scale(0.98);
			max-height: 0;
			margin-top: -0.5rem;
		}
	}

	&.fade-in {
		animation: toast-in 0.25s ease-out forwards;
	}

	&.fade-out {
		animation: toast-out 0.25s ease-in forwards;
	}

	position: relative;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-width: min(16rem, calc(100vw - 2rem));
	max-width: min(26rem, calc(100vw - 2rem));
	padding: 0.75rem 0.625rem 0.75rem 0.875rem;
	overflow: hidden;

	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.floating};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	background: ${({ theme }) => theme.color.background};
	color: ${({ theme }) => theme.color.text};

	/* 종류별 색의 원형 배지 */
	.icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		color: ${({ theme, $type }) => typeColor(theme, $type)};
		background: ${({ theme, $type }) => `color-mix(in srgb, ${typeColor(theme, $type)} 14%, transparent)`};

		svg {
			width: 1.125rem;
			height: 1.125rem;
		}
	}

	p {
		flex: 1;
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		line-height: 1.5;
		word-break: keep-all;
	}

	.close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: none;
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		background: transparent;
		color: ${({ theme }) => theme.color.subText};
		cursor: pointer;

		svg {
			width: 1rem;
			height: 1rem;
		}

		&:hover {
			background: ${({ theme }) => theme.color.surface};
			color: ${({ theme }) => theme.color.text};
		}
	}
`;

interface ProgressProps {
	$type: ToastType;
	$progress: number;
}

/** 남은 시간: 아래쪽 얇은 줄 (마우스를 올리면 멈춤) */
const ProgressBar = styled.div.attrs<ProgressProps>(({ $progress, theme, $type }) => ({
	style: {
		width: `${$progress}%`,
		background: typeColor(theme, $type),
	},
}))<ProgressProps>`
	position: absolute;
	bottom: 0;
	left: 0;
	height: 2px;
	opacity: 0.6;
	transition: width 0.1s linear;
`;

Toast.displayName = 'Toast';
export default Toast;
