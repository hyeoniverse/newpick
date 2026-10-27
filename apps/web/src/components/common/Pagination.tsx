'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

interface Props {
	/** 1부터 */
	page: number;
	total: number;
	pageSize: number;
	onChange: (page: number) => void;
	className?: string;
}

/** 지금 쪽 앞뒤로 몇 쪽씩 · 처음 · 끝, 사이는 … */
export function pages(current: number, last: number): (number | '…')[] {
	const set = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
	const sorted = [...set].sort((a, b) => a - b);
	const out: (number | '…')[] = [];
	sorted.forEach((p, i) => {
		if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
		out.push(p);
	});
	return out;
}

/** 쪽 번호 직접 넣기: [ 4 ] / 12 · Enter나 이동으로 간다. 범위 밖이면 처음 · 끝으로 맞춘다 */
function PageJump({ page, last, onChange }: { page: number; last: number; onChange: (page: number) => void }) {
	const [value, setValue] = useState(String(page));
	const [shown, setShown] = useState(page);
	// 다른 길(번호 · 화살표)로 쪽이 바뀌면 칸도 따라간다
	if (shown !== page) {
		setShown(page);
		setValue(String(page));
	}
	return (
		<form
			className="jump"
			onSubmit={(event) => {
				event.preventDefault();
				const next = Math.min(last, Math.max(1, Math.trunc(Number(value)) || page));
				setValue(String(next));
				if (next !== page) onChange(next);
			}}
		>
			<input
				type="number"
				inputMode="numeric"
				value={value}
				onChange={(event) => setValue(event.target.value)}
				aria-label={`이동할 쪽 (1~${last})`}
			/>
			<span className="last">/ {last}</span>
			<button type="submit">이동</button>
		</form>
	);
}

/**
 * 쪽 번호 (공통). ‹ 1 … 4 5 6 … 12 › [ 4 ] / 12 이동. 한 쪽뿐이면 그리지 않는다
 */
export default function Pagination({ page, total, pageSize, onChange, className }: Props) {
	const last = Math.max(1, Math.ceil(total / pageSize));
	if (last <= 1) return null;
	return (
		<StyledPagination className={className} aria-label="쪽 이동">
			<button type="button" aria-label="이전 쪽" disabled={page <= 1} onClick={() => onChange(page - 1)}>
				<LuChevronLeft aria-hidden />
			</button>
			{pages(page, last).map((p, i) =>
				p === '…' ? (
					<span key={`gap-${i}`} className="gap" aria-hidden>
						…
					</span>
				) : (
					<button
						key={p}
						type="button"
						aria-current={p === page ? 'page' : undefined}
						aria-label={`${p}쪽`}
						onClick={() => onChange(p)}
					>
						{p}
					</button>
				),
			)}
			<button type="button" aria-label="다음 쪽" disabled={page >= last} onClick={() => onChange(page + 1)}>
				<LuChevronRight aria-hidden />
			</button>
			<PageJump page={page} last={last} onChange={onChange} />
		</StyledPagination>
	);
}

const StyledPagination = styled.nav`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;

	button {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2.25rem;
		height: 2.25rem;
		padding: 0 0.5rem;
		border-radius: 6px;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.text};
		cursor: pointer;

		&:hover:not(:disabled):not([aria-current='page']) {
			background: ${({ theme }) => theme.color.neutral};
		}

		&[aria-current='page'] {
			background: ${({ theme }) => theme.color.primary};
			color: #ffffff;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}

		&:disabled {
			opacity: 0.3;
			cursor: default;
		}

		svg {
			width: 1rem;
			height: 1rem;
		}
	}

	/* 쪽 직접 넣기: 번호 줄 오른쪽, 좁은 화면은 아래 줄 */
	.jump {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-left: 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;

		input {
			width: 3.5rem;
			height: 2.25rem;
			padding: 0 0.5rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
			background: ${({ theme }) => theme.color.background};
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.text};
			text-align: center;
			appearance: textfield;

			&::-webkit-inner-spin-button,
			&::-webkit-outer-spin-button {
				appearance: none;
				margin: 0;
			}
		}

		button {
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-wrap: wrap;

		.jump {
			flex-basis: 100%;
			justify-content: center;
			margin: 0.5rem 0 0;
		}
	}

	.gap {
		min-width: 1.5rem;
		text-align: center;
		color: ${({ theme }) => theme.color.subText};
	}
`;
