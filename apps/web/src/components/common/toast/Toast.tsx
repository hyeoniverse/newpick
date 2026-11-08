'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOAST } from '@/constants/numbers';
import { ToastItem, ToastType } from '@/models/toast.model';
import { useToast } from '@/hooks/useToast';

import { cx } from '@/styles/tw';
import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert, LuX } from 'react-icons/lu';

const ICONS: Record<ToastType, React.ReactNode> = {
	info: <LuInfo />,
	success: <LuCircleCheck />,
	warning: <LuTriangleAlert />,
	error: <LuCircleX />,
};

/** 종류별 색 (--toast-tone): 배지 · 남은 시간 줄 */
const TONE: Record<ToastType, string> = {
	info: 'var(--np-color-primary)',
	success: 'var(--np-color-success)',
	warning: 'var(--np-color-warning)',
	error: 'var(--np-color-error)',
};

const Toast = React.memo(({ id, message, type, duration = TOAST.DURATION, action }: ToastItem & { index: number }) => {
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
		<div
			className={cx(
				'relative flex max-w-[min(26rem,calc(100vw-2rem))] min-w-[min(16rem,calc(100vw-2rem))] items-center gap-3 overflow-hidden rounded-floating border border-solid border-border bg-background py-3 pr-2.5 pl-3.5 text-text shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
				isFadingOut ? 'fade-out animate-toast-out' : 'fade-in animate-toast-in',
			)}
			// 위쪽에 뜨는 토스트는 위에서, 아래쪽은 아래에서 들어온다 (global.css의 toast-in · toast-out)
			style={
				{
					'--toast-tone': TONE[type],
					'--toast-from': position.includes('top') ? '-12px' : '12px',
				} as React.CSSProperties
			}
			// 오류는 바로 읽히게(alert), 나머지는 하던 일을 끊지 않게(status)
			role={type === 'error' ? 'alert' : 'status'}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onAnimationEnd={handleAnimationEnd}
		>
			{/* 종류별 색의 원형 배지 */}
			<span className="icon flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--toast-tone)_14%,transparent)] text-[var(--toast-tone)] [&_svg]:size-[1.125rem]">
				{ICONS[type]}
			</span>
			<div className="body flex min-w-0 flex-1 flex-col items-start gap-0.5">
				<p className="m-0 text-small leading-[1.5] font-medium [word-break:keep-all]">{message}</p>
				{action && (
					<Link
						href={action.href}
						className="action text-extra-small font-semi-bold text-primary hover:underline"
						onClick={startFadeOut}
					>
						{action.label}
					</Link>
				)}
			</div>
			<button
				type="button"
				className="close flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-sub-text hover:bg-surface hover:text-text [&_svg]:size-4"
				onClick={startFadeOut}
				aria-label="알림 닫기"
			>
				<LuX />
			</button>
			{/* 남은 시간: 아래쪽 얇은 줄 (마우스를 올리면 멈춤) */}
			<div
				className="absolute bottom-0 left-0 h-0.5 bg-[var(--toast-tone)] opacity-60 [transition:width_0.1s_linear]"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
});

Toast.displayName = 'Toast';
export default Toast;
