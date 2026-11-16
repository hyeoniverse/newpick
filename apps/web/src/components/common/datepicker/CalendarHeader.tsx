'use client';

import { useState } from 'react';
import type { ReactDatePickerCustomHeaderProps } from 'react-datepicker';
import { LuChevronDown, LuChevronLeft, LuChevronRight } from 'react-icons/lu';

const YEARS_PER_PAGE = 12;

/**
 * 달력 머리: ‹ 2026년 10월 ▾ ›. 제목을 누르면 달 고르기(12달), 거기서 연도를 누르면 연도 고르기(12년).
 * 멀리 있는 날짜도 몇 번만 눌러 간다. min · max 밖은 고를 수 없게 흐리게
 */
export default function CalendarHeader({
	monthDate,
	changeMonth,
	changeYear,
	decreaseMonth,
	increaseMonth,
	prevMonthButtonDisabled,
	nextMonthButtonDisabled,
	min,
	max,
}: ReactDatePickerCustomHeaderProps & { min: Date | null; max: Date | null }) {
	const [panel, setPanel] = useState<'none' | 'month' | 'year'>('none');
	const year = monthDate.getFullYear();
	const [panelYear, setPanelYear] = useState(year);
	const [yearPageStart, setYearPageStart] = useState(year - (year % YEARS_PER_PAGE));

	const minYear = min?.getFullYear() ?? -Infinity;
	const maxYear = max?.getFullYear() ?? Infinity;
	// 그 달 전체가 범위 밖이면 못 고름
	const monthDisabled = (y: number, m: number) =>
		(min !== null && new Date(y, m + 1, 0) < min) || (max !== null && new Date(y, m, 1) > max);

	const openMonths = () => {
		setPanelYear(year);
		setPanel(panel === 'none' ? 'month' : 'none');
	};

	return (
		<div className={panel === 'none' ? 'np-header' : 'np-header panel-open'}>
			<button
				type="button"
				className="nav"
				aria-label="이전 달"
				onClick={decreaseMonth}
				disabled={prevMonthButtonDisabled || panel !== 'none'}
			>
				<LuChevronLeft aria-hidden />
			</button>
			<button type="button" className="title" aria-expanded={panel !== 'none'} onClick={openMonths}>
				{year}년 {monthDate.getMonth() + 1}월
				<LuChevronDown aria-hidden className={panel !== 'none' ? 'open' : ''} />
			</button>
			<button
				type="button"
				className="nav"
				aria-label="다음 달"
				onClick={increaseMonth}
				disabled={nextMonthButtonDisabled || panel !== 'none'}
			>
				<LuChevronRight aria-hidden />
			</button>

			{panel === 'month' && (
				<div className="np-panel" role="dialog" aria-label="달 고르기">
					<div className="panel-head">
						<button
							type="button"
							className="nav"
							aria-label="이전 해"
							onClick={() => setPanelYear(panelYear - 1)}
							disabled={panelYear - 1 < minYear}
						>
							<LuChevronLeft aria-hidden />
						</button>
						<button
							type="button"
							className="title"
							onClick={() => {
								setYearPageStart(panelYear - (panelYear % YEARS_PER_PAGE));
								setPanel('year');
							}}
						>
							{panelYear}년
							<LuChevronDown aria-hidden />
						</button>
						<button
							type="button"
							className="nav"
							aria-label="다음 해"
							onClick={() => setPanelYear(panelYear + 1)}
							disabled={panelYear + 1 > maxYear}
						>
							<LuChevronRight aria-hidden />
						</button>
					</div>
					<div className="cell-grid">
						{Array.from({ length: 12 }, (_, m) => (
							<button
								key={m}
								type="button"
								className={panelYear === year && m === monthDate.getMonth() ? 'cell current' : 'cell'}
								disabled={monthDisabled(panelYear, m)}
								onClick={() => {
									changeYear(panelYear);
									changeMonth(m);
									setPanel('none');
								}}
							>
								{m + 1}월
							</button>
						))}
					</div>
				</div>
			)}

			{panel === 'year' && (
				<div className="np-panel" role="dialog" aria-label="연도 고르기">
					<div className="panel-head">
						<button
							type="button"
							className="nav"
							aria-label="이전 12년"
							onClick={() => setYearPageStart(yearPageStart - YEARS_PER_PAGE)}
							disabled={yearPageStart - 1 < minYear}
						>
							<LuChevronLeft aria-hidden />
						</button>
						<span className="title is-static">
							{yearPageStart} – {yearPageStart + YEARS_PER_PAGE - 1}
						</span>
						<button
							type="button"
							className="nav"
							aria-label="다음 12년"
							onClick={() => setYearPageStart(yearPageStart + YEARS_PER_PAGE)}
							disabled={yearPageStart + YEARS_PER_PAGE > maxYear}
						>
							<LuChevronRight aria-hidden />
						</button>
					</div>
					<div className="cell-grid">
						{Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i).map((y) => (
							<button
								key={y}
								type="button"
								className={y === panelYear ? 'cell current' : 'cell'}
								disabled={y < minYear || y > maxYear}
								onClick={() => {
									setPanelYear(y);
									setPanel('month');
								}}
							>
								{y}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
