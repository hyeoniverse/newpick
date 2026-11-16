'use client';

import type { MonthIndex } from '@newpick/shared';
import { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { useDismiss } from '@/hooks/useDismiss';
import Roll from './Roll';

/**
 * 달 막대의 연도 · 월 고르기 (#198): '2026년 ▾' · '10월 ▾'를 따로 펼쳐 받은 해 · 달로 바로 간다 (개수와 함께).
 * 달이 바뀌면 글자는 숫자판처럼 넘어간다(enter 방향). 바깥(막대 밖)을 누르거나 Esc면 닫는다
 */
export default function MonthPicker({
	month,
	months,
	enter,
	onJump,
	barRef,
}: {
	/** 막대에 보이는 달 'YYYY-MM' */
	month: string;
	/** 바로 가기용 달 목록 (서버가 준 것: 달마다 개수 · 첫 순번) */
	months: MonthIndex[];
	enter: string;
	onJump: (month: MonthIndex) => void;
	/** 이 안을 누르면 닫지 않는다 (막대 전체) */
	barRef: React.RefObject<HTMLDivElement | null>;
}) {
	const [open, setOpen] = useState<'year' | 'month' | null>(null);
	const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
	const year = month.slice(0, 4);
	useDismiss({ open: !!open, refs: [barRef], onClose: () => setOpen(null) });

	return (
		<div className="month-title">
			<div className="picker">
				<button
					type="button"
					aria-haspopup="listbox"
					aria-expanded={open === 'year'}
					onClick={() => setOpen((v) => (v === 'year' ? null : 'year'))}
				>
					<Roll value={`${year}년`} enter={enter} />
					<LuChevronDown aria-hidden />
				</button>
				{open === 'year' && (
					<ul className="month-menu" role="listbox" aria-label="받은 해로 이동">
						{years.map((y) => {
							const yearMonths = months.filter((m) => m.month.startsWith(y));
							return (
								<li key={y} role="option" aria-selected={y === year}>
									<button
										type="button"
										onClick={() => {
											setOpen(null);
											// 그해에서 지금 정렬 순서로 가장 먼저 나오는 달로
											onJump(yearMonths[0]);
										}}
									>
										{y}년<span className="month-count">{yearMonths.reduce((n, m) => n + m.count, 0)}통</span>
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
			<div className="picker">
				<button
					type="button"
					aria-haspopup="listbox"
					aria-expanded={open === 'month'}
					onClick={() => setOpen((v) => (v === 'month' ? null : 'month'))}
				>
					<Roll value={`${Number(month.slice(5))}월`} enter={enter} className="roll-month" />
					<LuChevronDown aria-hidden />
				</button>
				{open === 'month' && (
					<ul className="month-menu" role="listbox" aria-label={`${year}년 받은 달로 이동`}>
						{months
							.filter((m) => m.month.startsWith(year))
							.map((m) => (
								<li key={m.month} role="option" aria-selected={m.month === month}>
									<button
										type="button"
										onClick={() => {
											setOpen(null);
											onJump(m);
										}}
									>
										{Number(m.month.slice(5))}월<span className="month-count">{m.count}통</span>
									</button>
								</li>
							))}
					</ul>
				)}
			</div>
		</div>
	);
}
