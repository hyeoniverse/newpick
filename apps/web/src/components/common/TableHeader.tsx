'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { LuArrowDown, LuArrowUp, LuArrowUpDown, LuChevronDown } from 'react-icons/lu';

interface Option {
	label: string;
	value: string;
}

interface Props {
	/** 표 머리 글자 (예: '관심사') */
	label: string;
	options: Option[];
	/** 지금 고른 값. ''이면 거르지 않는 중 */
	value: string;
	onChange: (value: string) => void;
	/** 거르는 중일 때 머리 글자를 강조색으로 (기간처럼 늘 걸려 있는 건 끈다) */
	highlight?: boolean;
}

/**
 * 표 머리에서 고르기 (공통, 관리자 표에서 시작). 머리 글자를 누르면 고를 목록이 열린다. 고른 값이 있으면 글자가 강조색.
 * 표는 좁은 화면에서 옆으로 넘기느라(overflow) 안쪽 목록이 잘리므로, 목록은 화면 기준(fixed)으로 띄운다
 */
export function HeaderSelect({ label, options, value, onChange, highlight = true }: Props) {
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
	const rootRef = useRef<HTMLSpanElement>(null);
	const open = pos !== null;

	// 바깥을 누르거나 Esc · 스크롤 · 창 크기 바꾸면 닫기 (fixed라 자리가 어긋나지 않게)
	useEffect(() => {
		if (!open) return;
		const close = () => setPos(null);
		const onDown = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) close();
		};
		const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close();
		// 목록 안을 스크롤할 때는 닫지 않는다 (바깥 페이지 · 표가 움직일 때만)
		const onScroll = (event: Event) => {
			if (!rootRef.current?.contains(event.target as Node)) close();
		};
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', close);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', close);
		};
	}, [open]);

	return (
		<StyledTableHeader ref={rootRef}>
			<button
				type="button"
				className={value && highlight ? 'trigger active' : 'trigger'}
				aria-haspopup="true"
				aria-label={`${label} 거르기${value ? ` (${options.find((o) => o.value === value)?.label ?? value})` : ''}`}
				aria-expanded={open}
				onClick={(event) => {
					if (open) return setPos(null);
					const rect = event.currentTarget.getBoundingClientRect();
					setPos({ top: rect.bottom + 4, left: rect.left });
				}}
			>
				{label}
				<LuChevronDown aria-hidden />
			</button>
			{pos && (
				<div className="menu" role="group" aria-label={`${label}로 거르기`} style={{ top: pos.top, left: pos.left }}>
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							aria-pressed={option.value === value}
							onClick={() => {
								onChange(option.value);
								setPos(null);
							}}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</StyledTableHeader>
	);
}

export type SortOrder = 'asc' | 'desc' | '';

/**
 * 표 머리 정렬 버튼 (공통). 누를 때마다 first → 반대 → 기본('')을 돈다.
 * 숫자는 큰 순(desc)부터, 글자는 가나다순(asc)부터 시작하게 first로 정한다
 */
export function SortButton({
	label,
	order,
	first = 'desc',
	onChange,
}: {
	label: string;
	/** 지금 순서. ''이면 이 칸으로 정렬하지 않는 중 */
	order: SortOrder;
	first?: 'asc' | 'desc';
	onChange: (next: SortOrder) => void;
}) {
	const second = first === 'desc' ? 'asc' : 'desc';
	const next: SortOrder = !order ? first : order === first ? second : '';
	const words: Record<string, string> =
		first === 'asc' ? { asc: '가나다순', desc: '가나다 역순' } : { asc: '작은 순', desc: '큰 순' };
	const Icon = order === 'desc' ? LuArrowDown : order === 'asc' ? LuArrowUp : LuArrowUpDown;
	return (
		<StyledTableHeader>
			<button
				type="button"
				className={order ? 'trigger active' : 'trigger'}
				aria-label={`${label} ${words[order] ?? ''} 정렬, 누르면 ${words[next] ?? '기본 순서'}`}
				onClick={() => onChange(next)}
			>
				{label}
				<Icon aria-hidden />
			</button>
		</StyledTableHeader>
	);
}

const StyledTableHeader = styled.span`
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;

		svg {
			width: 0.875rem;
			height: 0.875rem;
			color: ${({ theme }) => theme.color.subText};
		}

		&.active,
		&.active svg {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 달력 · 시각 고르기와 같은 얇은 테두리 · 8px 모서리 · 그림자 없음 */
	.menu {
		position: fixed;
		z-index: 950;
		display: flex;
		flex-direction: column;
		min-width: 9rem;
		max-height: 16rem;
		padding: 0.375rem;
		overflow-y: auto;
		overscroll-behavior: contain;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		scrollbar-width: thin;

		button {
			padding: 0.4375rem 0.625rem;
			border-radius: 6px;
			text-align: left;
			white-space: nowrap;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.regular};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&:hover {
				background: ${({ theme }) => theme.color.neutral};
			}

			&[aria-pressed='true'] {
				background: ${({ theme }) => theme.color.tertiary};
				color: ${({ theme }) => theme.color.primary};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			}
		}
	}
`;
