'use client';

import { useEffect, useId, useState } from 'react';
import styled, { css } from 'styled-components';
import ReactDatePicker, { registerLocale, type ReactDatePickerCustomHeaderProps } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { LuCalendar, LuChevronDown, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import 'react-datepicker/dist/react-datepicker.css';
import { fieldControl, fieldLabel } from '@/components/common/field';

registerLocale('ko', ko);

/** 날짜 값은 주소 · API와 같은 'YYYY-MM-DD' 문자열로 주고받는다 */
type DateString = string;

const toDate = (value?: DateString | null) => {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const [y, m, d] = value.split('-').map(Number);
	return new Date(y, m - 1, d);
};
const toValue = (date: Date | null) => (date ? format(date, 'yyyy-MM-dd') : '');

type Size = 'medium' | 'small';

const YEARS_PER_PAGE = 12;

/**
 * 달력 머리: ‹ 2026년 10월 ▾ ›. 제목을 누르면 달 고르기(12달), 거기서 연도를 누르면 연도 고르기(12년).
 * 멀리 있는 날짜도 몇 번만 눌러 간다. min · max 밖은 고를 수 없게 흐리게
 */
function CalendarHeader({
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
		<div className="np-header">
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
					<div className="grid">
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
						<span className="title static">
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
					<div className="grid">
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

interface CommonProps {
	label?: string;
	/** 고를 수 있는 가장 이른 · 늦은 날 */
	min?: DateString;
	max?: DateString;
	/** medium: 다른 입력칸과 같은 높이(3rem), small: 필터 줄 같은 좁은 곳(2.25rem) */
	size?: Size;
	placeholder?: string;
	className?: string;
}

interface DatePickerProps extends CommonProps {
	value?: DateString | null;
	onChange: (value: DateString) => void;
	onBlur?: () => void;
}

/**
 * 날짜 하나 고르기 (공통). 한국어 달력, 직접 입력(YYYY-MM-DD)도 된다
 */
export function DatePicker({ label, value, onChange, onBlur, min, max, size = 'medium', placeholder, className }: DatePickerProps) {
	const inputId = useId();
	return (
		<StyledDatePicker $size={size} className={className}>
			{label && <label htmlFor={inputId}>{label}</label>}
			<div className="control">
				<LuCalendar className="calendar-icon" aria-hidden />
				<ReactDatePicker
					id={inputId}
					locale="ko"
					className="date-input"
					calendarClassName="np-calendar"
					selected={toDate(value)}
					onChange={(date: Date | null) => onChange(toValue(date))}
					onBlur={onBlur}
					minDate={toDate(min) ?? undefined}
					maxDate={toDate(max) ?? undefined}
					dateFormat="yyyy-MM-dd"
					renderCustomHeader={(props) => <CalendarHeader {...props} min={toDate(min)} max={toDate(max)} />}
					placeholderText={placeholder ?? '날짜 선택'}
					shouldCloseOnSelect
					popperPlacement="bottom-start"
				/>
			</div>
		</StyledDatePicker>
	);
}

interface DateRangePickerProps extends CommonProps {
	start?: DateString | null;
	end?: DateString | null;
	/** 시작 · 끝을 모두 고르면 한 번 부른다 (지우면 둘 다 '') */
	onChange: (range: { start: DateString; end: DateString }) => void;
}

/**
 * 기간 고르기 (공통). 달력 하나에서 시작 → 끝을 차례로 누른다. 끝까지 고르기 전에는 밖으로 알리지 않는다
 */
export function DateRangePicker({
	label,
	start,
	end,
	onChange,
	min,
	max,
	size = 'medium',
	placeholder,
	className,
}: DateRangePickerProps) {
	const inputId = useId();
	// 고르는 중(시작만 누른 상태)은 안에서만 들고 있는다
	const [range, setRange] = useState<[Date | null, Date | null]>([toDate(start), toDate(end)]);
	useEffect(() => setRange([toDate(start), toDate(end)]), [start, end]);

	return (
		<StyledDatePicker $size={size} className={className} $range>
			{label && <label htmlFor={inputId}>{label}</label>}
			<div className="control">
				<LuCalendar className="calendar-icon" aria-hidden />
				<ReactDatePicker
					id={inputId}
					locale="ko"
					className="date-input"
					calendarClassName="np-calendar"
					selectsRange
					startDate={range[0]}
					endDate={range[1]}
					onChange={(dates: [Date | null, Date | null]) => {
						setRange(dates);
						const [from, to] = dates;
						if ((from && to) || (!from && !to)) onChange({ start: toValue(from), end: toValue(to) });
					}}
					minDate={toDate(min) ?? undefined}
					maxDate={toDate(max) ?? undefined}
					dateFormat="yyyy-MM-dd"
					renderCustomHeader={(props) => <CalendarHeader {...props} min={toDate(min)} max={toDate(max)} />}
					placeholderText={placeholder ?? '시작일 ~ 종료일'}
					// 입력칸 글자: '시작 ~ 끝' (고르는 중이면 '시작 ~')
					value={range[0] ? `${toValue(range[0])} ~ ${toValue(range[1])}`.trimEnd() : ''}
					popperPlacement="bottom-start"
				/>
			</div>
		</StyledDatePicker>
	);
}

export default DatePicker;

/** 달력 모양: 얇은 테두리 · 8px 모서리 · 그림자 없음 · 선택은 강조색, 기간은 옅은 강조색 */
const calendar = css`
	.react-datepicker-popper {
		z-index: 30;
	}

	.react-datepicker-popper .react-datepicker__triangle {
		display: none;
	}

	.np-calendar {
		padding: 0.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		color: ${({ theme }) => theme.color.text};
		font-family: inherit;
		font-size: ${({ theme }) => theme.fontSize.small};

		/* 달 · 연도 고르기 판이 달력 전체를 덮도록 머리는 기준에서 뺀다 */
		.react-datepicker__month-container {
			position: relative;
		}

		.react-datepicker__header {
			position: static;
			padding: 0 0 0.375rem;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			background: transparent;
		}

		.np-header,
		.panel-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 0.375rem;
		}

		.nav {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 2rem;
			height: 2rem;
			border-radius: 6px;
			color: ${({ theme }) => theme.color.subText};
			cursor: pointer;

			&:hover:not(:disabled) {
				background: ${({ theme }) => theme.color.neutral};
				color: ${({ theme }) => theme.color.text};
			}

			&:disabled {
				opacity: 0.3;
				cursor: default;
			}
		}

		.title {
			display: inline-flex;
			align-items: center;
			gap: 0.25rem;
			height: 2rem;
			padding: 0 0.625rem;
			border-radius: 6px;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&:hover:not(.static) {
				background: ${({ theme }) => theme.color.neutral};
			}

			&.static {
				cursor: default;
				font-variant-numeric: tabular-nums;
			}

			svg {
				width: 0.875rem;
				height: 0.875rem;
				transition: transform 0.2s ease;

				&.open {
					transform: rotate(180deg);
				}
			}
		}

		/* 달 · 연도 고르기: 머리 아래 달력 자리를 덮는다 */
		.np-panel {
			position: absolute;
			inset: 2.5rem 0 0 0;
			z-index: 2;
			display: flex;
			flex-direction: column;
			background: ${({ theme }) => theme.color.background};
		}

		.grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 0.25rem;
			flex: 1;
			align-content: center;
		}

		.cell {
			height: 2.75rem;
			border-radius: 6px;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&:hover:not(:disabled) {
				background: ${({ theme }) => theme.color.neutral};
			}

			&.current {
				background: ${({ theme }) => theme.color.primary};
				color: #ffffff;
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			}

			&:disabled {
				color: ${({ theme }) => theme.color.disabled};
				cursor: default;
			}
		}

		.react-datepicker__day-name {
			color: ${({ theme }) => theme.color.subText};
		}

		.react-datepicker__day-name,
		.react-datepicker__day {
			width: 2.25rem;
			line-height: 2.25rem;
			margin: 0.0625rem;
		}

		.react-datepicker__day,
		.react-datepicker__day--today,
		.react-datepicker__day--in-range {
			border-radius: 6px;
			color: ${({ theme }) => theme.color.text};

			&:hover {
				background: ${({ theme }) => theme.color.neutral};
			}
		}

		/* 일요일 */
		.react-datepicker__week > .react-datepicker__day:first-child:not(.react-datepicker__day--selected) {
			color: ${({ theme }) => theme.color.error};
		}

		.react-datepicker__day--today {
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			box-shadow: inset 0 0 0 1px ${({ theme }) => theme.color.border};
		}

		.react-datepicker__day--outside-month {
			opacity: 0.4;
		}

		.react-datepicker__day--disabled {
			color: ${({ theme }) => theme.color.disabled};
			pointer-events: none;
		}

		/* 모든 날짜 칸은 같은 모서리 (기간 · 오늘 · 선택 모두) */
		.react-datepicker__day--in-range,
		.react-datepicker__day--in-selecting-range {
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 14%, transparent);
			color: ${({ theme }) => theme.color.text};
		}

		.react-datepicker__day--selected,
		.react-datepicker__day--range-start,
		.react-datepicker__day--range-end,
		.react-datepicker__day--selecting-range-start,
		.react-datepicker__day--keyboard-selected {
			background: ${({ theme }) => theme.color.primary};
			color: #ffffff;
		}
	}
`;

const StyledDatePicker = styled.div<{ $size: Size; $range?: boolean }>`
	display: flex;
	flex-direction: column;
	width: ${({ $size, $range }) => ($size === 'small' ? ($range ? '16.5rem' : '9.5rem') : '100%')};
	max-width: 100%;

	label {
		${fieldLabel}
	}

	.control {
		position: relative;
	}

	.calendar-icon {
		position: absolute;
		top: 50%;
		left: 0.75rem;
		z-index: 1;
		width: 1rem;
		height: 1rem;
		color: ${({ theme }) => theme.color.subText};
		transform: translateY(-50%);
		pointer-events: none;
	}

	.react-datepicker-wrapper,
	.react-datepicker__input-container {
		display: block;
		width: 100%;
	}

	.date-input {
		${fieldControl}
		padding-left: 2.25rem;
		font-variant-numeric: tabular-nums;
		${({ $size }) =>
			$size === 'small' &&
			css`
				height: 2.25rem;
			`}
	}

	${calendar}
`;
