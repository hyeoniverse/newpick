'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { LuClock } from 'react-icons/lu';
import { fieldControl, fieldLabel } from '@/components/common/field';

type Size = 'medium' | 'small';

interface Props {
	/** 'HH:mm' (24시간) */
	value: string;
	onChange: (value: string) => void;
	label?: string;
	/** 분 간격 (기본 5분) */
	minuteStep?: number;
	/** medium: 다른 입력칸과 같은 높이(3rem), small: 좁은 곳(2.5rem) */
	size?: Size;
	className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 시각 고르기 (공통). 날짜 고르기(DatePicker)와 같은 모양의 칸, 늘 24시간 'HH:mm'.
 * 누르면 시(00~23) · 분(간격) 두 줄이 열리고, 분을 고르면 닫힌다. 바깥을 누르거나 Esc로도 닫힌다
 */
export default function TimePicker({ value, onChange, label, minuteStep = 5, size = 'medium', className }: Props) {
	const id = useId();
	const [open, setOpen] = useState(false);
	// 아래 자리가 모자라면 위로 연다
	const [upward, setUpward] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const [hour, minute] = value.split(':').map(Number);
	const steps = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
	// 간격에 없는 분(예: 08:07)도 목록에 보이게
	const minutes = steps.includes(minute) ? steps : [...steps, minute].sort((a, b) => a - b);

	// 바깥을 누르거나 Esc면 닫기
	useEffect(() => {
		if (!open) return;
		const onDown = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			// 시각 목록만 닫고, 이 칸을 담은 시트(모달)까지 닫히지 않게 여기서 멈춘다
			event.stopPropagation();
			setOpen(false);
		};
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	// 열면 고른 시 · 분이 보이게
	useEffect(() => {
		if (!open) return;
		// scrollIntoView는 바깥(시트 · 페이지)까지 움직이므로 목록 안에서만 옮긴다
		rootRef.current?.querySelectorAll<HTMLElement>('[aria-selected="true"]').forEach((el) => {
			const list = el.closest('ul');
			if (list) list.scrollTop = el.offsetTop - list.offsetTop - list.clientHeight / 2 + el.offsetHeight / 2;
		});
	}, [open]);

	return (
		<StyledTimePicker ref={rootRef} $size={size} className={className}>
			{label && <label htmlFor={id}>{label}</label>}
			<button
				id={id}
				type="button"
				className="time-input"
				aria-haspopup="listbox"
				aria-expanded={open}
				onClick={(event) => {
					const { bottom } = event.currentTarget.getBoundingClientRect();
					setUpward(window.innerHeight - bottom < 220);
					setOpen((prev) => !prev);
				}}
			>
				<LuClock className="clock-icon" aria-hidden />
				{value}
			</button>
			{open && (
				<div className={upward ? 'panel upward' : 'panel'}>
					<ul role="listbox" aria-label="시">
						{Array.from({ length: 24 }, (_, h) => (
							<li key={h}>
								<button
									type="button"
									role="option"
									aria-selected={h === hour}
									onClick={() => onChange(`${pad(h)}:${pad(minute)}`)}
								>
									{pad(h)}
								</button>
							</li>
						))}
					</ul>
					<ul role="listbox" aria-label="분">
						{minutes.map((m) => (
							<li key={m}>
								<button
									type="button"
									role="option"
									aria-selected={m === minute}
									onClick={() => {
										onChange(`${pad(hour)}:${pad(m)}`);
										setOpen(false);
									}}
								>
									{pad(m)}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</StyledTimePicker>
	);
}

const StyledTimePicker = styled.div<{ $size: Size }>`
	position: relative;
	display: flex;
	flex-direction: column;

	label {
		${fieldLabel}
	}

	.time-input {
		${fieldControl}
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-left: 0.75rem;
		text-align: left;
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		${({ $size }) =>
			$size === 'small' &&
			css`
				height: 2.5rem;
			`}

		&[aria-expanded='true'] {
			border-color: ${({ theme }) => theme.color.primary};
		}
	}

	.clock-icon {
		flex-shrink: 0;
		width: 1rem;
		height: 1rem;
		color: ${({ theme }) => theme.color.subText};
	}

	/* 시 · 분 두 줄: 달력과 같은 얇은 테두리 · 8px 모서리 · 그림자 없음 */
	.panel {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		z-index: 30;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem;
		width: 100%;
		min-width: 8.5rem;
		padding: 0.375rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};

		&.upward {
			top: auto;
			bottom: calc(100% + 0.25rem);
		}
	}

	ul {
		max-height: 12rem;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		list-style: none;
		scrollbar-width: thin;

		& + ul {
			border-left: 1px solid ${({ theme }) => theme.color.border};
			padding-left: 0.25rem;
		}
	}

	[role='option'] {
		width: 100%;
		padding: 0.375rem 0;
		border-radius: 6px;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.text};
		cursor: pointer;

		&:hover {
			background: ${({ theme }) => theme.color.neutral};
		}

		&[aria-selected='true'] {
			background: ${({ theme }) => theme.color.primary};
			color: #ffffff;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}
	}
`;
