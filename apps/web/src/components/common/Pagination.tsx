'use client';

import { useState } from 'react';
import { cx } from '@/styles/tw';
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

/* 쪽 단추 공통 (같은 속성 클래스가 둘 붙지 않게 지금 쪽 · 나머지 색을 나눈다) */
const BUTTON =
	'flex h-9 min-w-9 cursor-pointer items-center justify-center px-2 text-small tabular-nums disabled:cursor-default disabled:opacity-30 [&_svg]:size-4';
const ROUND = 'rounded-[6px]';
const BASE = 'text-text hover:enabled:bg-neutral';
const CURRENT = 'bg-primary font-semi-bold text-[#ffffff]';

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
			className="jump ml-3 flex items-center gap-1.5 text-small text-sub-text tabular-nums mobile:mx-0 mobile:mt-2 mobile:mb-0 mobile:basis-full mobile:justify-center"
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
				className="h-9 w-14 [appearance:textfield] rounded-none border border-solid border-border bg-background px-2 text-center text-small text-text [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
			/>
			<span className="last">/ {last}</span>
			<button type="submit" className={cx(BUTTON, BASE, 'rounded-none border border-solid border-border')}>
				이동
			</button>
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
		<nav className={cx('flex items-center justify-center gap-1 mobile:flex-wrap', className)} aria-label="쪽 이동">
			<button
				type="button"
				aria-label="이전 쪽"
				disabled={page <= 1}
				onClick={() => onChange(page - 1)}
				className={cx(BUTTON, BASE, ROUND)}
			>
				<LuChevronLeft aria-hidden />
			</button>
			{pages(page, last).map((p, i) =>
				p === '…' ? (
					<span key={`gap-${i}`} className="gap min-w-6 text-center text-sub-text" aria-hidden>
						…
					</span>
				) : (
					<button
						key={p}
						type="button"
						aria-current={p === page ? 'page' : undefined}
						aria-label={`${p}쪽`}
						onClick={() => onChange(p)}
						className={cx(BUTTON, ROUND, p === page ? CURRENT : BASE)}
					>
						{p}
					</button>
				),
			)}
			<button
				type="button"
				aria-label="다음 쪽"
				disabled={page >= last}
				onClick={() => onChange(page + 1)}
				className={cx(BUTTON, BASE, ROUND)}
			>
				<LuChevronRight aria-hidden />
			</button>
			<PageJump page={page} last={last} onChange={onChange} />
		</nav>
	);
}
