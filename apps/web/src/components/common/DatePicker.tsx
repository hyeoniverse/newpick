'use client';

import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import ReactDatePicker, { registerLocale, type ReactDatePickerCustomHeaderProps } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { LuCalendar, LuChevronDown, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import 'react-datepicker/dist/react-datepicker.css';
import { fieldControl, fieldLabel } from '@/components/common/field';
import { kstDate } from '@/utils/formatter';

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

/** 빠른 선택 버튼 하나: 누르면 그 날(또는 기간)로 */
export interface QuickPick<T> {
	label: string;
	value: () => T;
}

/** 날짜 하나 빠른 선택 (오늘 · 어제) */
export const DAY_PICKS: QuickPick<DateString>[] = [
	{ label: '오늘', value: () => kstDate(0) },
	{ label: '어제', value: () => kstDate(1) },
];

/** 기간 빠른 선택 (끝은 늘 오늘, 어제만 하루) */
export const RANGE_PICKS: QuickPick<{ start: DateString; end: DateString }>[] = [
	{ label: '오늘', value: () => ({ start: kstDate(0), end: kstDate(0) }) },
	{ label: '어제', value: () => ({ start: kstDate(1), end: kstDate(1) }) },
	{ label: '최근 7일', value: () => ({ start: kstDate(6), end: kstDate(0) }) },
	{ label: '최근 30일', value: () => ({ start: kstDate(29), end: kstDate(0) }) },
];

const inRange = (value: DateString, min?: DateString, max?: DateString) =>
	(!min || value >= min) && (!max || value <= max);

/** 달력 아래 빠른 선택 줄. 고를 수 없는 범위(min · max 밖)는 흐리게 */
function QuickPicks({
	picks,
	onPick,
}: {
	picks: { label: string; disabled: boolean; pick: () => void }[];
	onPick?: () => void;
}) {
	if (!picks.length) return null;
	return (
		<div className="np-quick" role="group" aria-label="빠른 선택">
			{picks.map((p) => (
				<button
					key={p.label}
					type="button"
					disabled={p.disabled}
					onClick={() => {
						p.pick();
						onPick?.();
					}}
				>
					{p.label}
				</button>
			))}
		</div>
	);
}

/**
 * 달력은 body 바로 아래 맨 위층에 띄운다. 필터 줄 · 카드 · 붙는 머리 같은 부모의 쌓임 순서에 가려지지 않게
 * (예전에는 입력칸 옆에 z-index 30으로 떠서 아래 내용 · 헤더 뒤로 숨었다)
 */
function CalendarLayer({ children }: { children?: React.ReactNode }) {
	// 서버 화면과 맞추려고 브라우저에 붙은 뒤에만 띄운다 (달력은 누른 뒤에야 열리므로 늦어도 괜찮다)
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted || !children) return null;
	return createPortal(<StyledCalendarLayer>{children}</StyledCalendarLayer>, document.body);
}

interface CommonProps {
	label?: string;
	/** 고를 수 있는 가장 이른 · 늦은 날 */
	min?: DateString;
	max?: DateString;
	/** medium: 다른 입력칸과 같은 높이(3rem), small: 필터 줄 같은 좁은 곳(2.25rem) */
	size?: Size;
	className?: string;
}

interface DatePickerProps extends CommonProps {
	value?: DateString | null;
	onChange: (value: DateString) => void;
	onBlur?: () => void;
	placeholder?: string;
	/** 달력 아래 빠른 선택 (기본 오늘 · 어제, []면 없음) */
	picks?: QuickPick<DateString>[];
}

/**
 * 날짜 하나 고르기 (공통). 한국어 달력, 직접 입력(YYYY-MM-DD)도 된다. 달력 아래 오늘 · 어제 빠른 선택
 */
export function DatePicker({
	label,
	value,
	onChange,
	onBlur,
	min,
	max,
	size = 'medium',
	placeholder,
	picks = DAY_PICKS,
	className,
}: DatePickerProps) {
	const inputId = useId();
	const pickerRef = useRef<ReactDatePicker>(null);
	return (
		<StyledDatePicker $size={size} className={className}>
			{label && <label htmlFor={inputId}>{label}</label>}
			<div className="control">
				<LuCalendar className="calendar-icon" aria-hidden />
				<ReactDatePicker
					ref={pickerRef}
					id={inputId}
					locale="ko"
					className="date-input"
					calendarClassName="np-calendar"
					popperContainer={CalendarLayer}
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
				>
					<QuickPicks
						picks={picks.map((p) => {
							const day = p.value();
							return { label: p.label, disabled: !inRange(day, min, max), pick: () => onChange(day) };
						})}
						onPick={() => pickerRef.current?.setOpen(false)}
					/>
				</ReactDatePicker>
			</div>
		</StyledDatePicker>
	);
}

/** 글자처럼 보이는 날짜 버튼 (달력을 여는 손잡이) */
const TriggerButton = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; label: string }>(
	({ value, onClick, label }, ref) => (
		<button type="button" ref={ref} className="date-trigger" onClick={onClick} aria-label={`${label}: ${value}`}>
			{value}
		</button>
	),
);
TriggerButton.displayName = 'TriggerButton';

interface DateTriggerProps {
	value: DateString;
	onChange: (value: DateString) => void;
	min?: DateString;
	max?: DateString;
	/** 화면 읽기 프로그램용 이름 (예: '시작 날짜') */
	label: string;
	className?: string;
}

/**
 * 글 속 날짜를 그대로 누르면 달력이 열리는 날짜 고르기 (공통).
 * 제목 '최근 7일 (2026-10-22 ~ 2026-10-28)'의 날짜처럼, 따로 입력칸을 두지 않을 때
 */
export function DateTrigger({ value, onChange, min, max, label, className }: DateTriggerProps) {
	return (
		<StyledTrigger className={className}>
			<ReactDatePicker
				locale="ko"
				calendarClassName="np-calendar"
				popperContainer={CalendarLayer}
				selected={toDate(value)}
				onChange={(date: Date | null) => date && onChange(toValue(date))}
				minDate={toDate(min) ?? undefined}
				maxDate={toDate(max) ?? undefined}
				dateFormat="yyyy-MM-dd"
				renderCustomHeader={(props) => <CalendarHeader {...props} min={toDate(min)} max={toDate(max)} />}
				customInput={<TriggerButton label={label} />}
				shouldCloseOnSelect
				popperPlacement="bottom-start"
			/>
		</StyledTrigger>
	);
}

interface DateRangePickerProps extends CommonProps {
	start?: DateString | null;
	end?: DateString | null;
	/** 시작 · 종료를 모두 고르면 부른다 (빠른 선택도 같음) */
	onChange: (range: { start: DateString; end: DateString }) => void;
	/** 두 칸의 이름 (화면 읽기 프로그램용, 보이는 이름표는 label 하나) */
	startLabel?: string;
	endLabel?: string;
	/** 달력 아래 빠른 선택 (기본 오늘 · 어제 · 최근 7일 · 최근 30일, []면 없음) */
	picks?: QuickPick<{ start: DateString; end: DateString }>[];
}

/**
 * 기간 고르기 (공통): [시작] ~ [종료] 두 칸. 어느 칸을 열어도 달력에는 지금 기간이 칠해져 보인다.
 * 시작을 고르면 종료 칸이 이어서 열리고, 시작이 종료보다 늦으면 종료를 시작에 맞춘다. 달력 아래 빠른 선택(오늘 · 최근 7일 …)
 */
export function DateRangePicker({
	label,
	start,
	end,
	onChange,
	min,
	max,
	size = 'medium',
	startLabel = '시작 날짜',
	endLabel = '종료 날짜',
	picks = RANGE_PICKS,
	className,
}: DateRangePickerProps) {
	const startId = useId();
	const endId = useId();
	const startRef = useRef<ReactDatePicker>(null);
	const endRef = useRef<ReactDatePicker>(null);
	// 시작만 고른 상태는 안에서만 들고 있는다 (둘 다 있어야 밖으로 알린다)
	const [range, setRange] = useState({ start: start ?? '', end: end ?? '' });
	useEffect(() => setRange({ start: start ?? '', end: end ?? '' }), [start, end]);

	const commit = (next: { start: DateString; end: DateString }) => {
		setRange(next);
		if (next.start && next.end) onChange(next);
	};
	const quick = (close: () => void) =>
		picks.map((p) => {
			const value = p.value();
			return {
				label: p.label,
				disabled: !inRange(value.start, min, max) || !inRange(value.end, min, max),
				pick: () => {
					commit(value);
					close();
				},
			};
		});

	const common = {
		locale: 'ko',
		className: 'date-input',
		calendarClassName: 'np-calendar',
		popperContainer: CalendarLayer,
		startDate: toDate(range.start),
		endDate: toDate(range.end),
		maxDate: toDate(max) ?? undefined,
		dateFormat: 'yyyy-MM-dd',
		renderCustomHeader: (props: ReactDatePickerCustomHeaderProps) => (
			<CalendarHeader {...props} min={toDate(min)} max={toDate(max)} />
		),
		shouldCloseOnSelect: true,
		popperPlacement: 'bottom-start' as const,
	};

	return (
		<StyledDatePicker $size={size} $range className={className}>
			{label && <span className="group-label">{label}</span>}
			<div className="range" role="group" aria-label={label ?? '기간'}>
				<div className="control">
					<label htmlFor={startId} className="sr-only">
						{startLabel}
					</label>
					<LuCalendar className="calendar-icon" aria-hidden />
					<ReactDatePicker
						{...common}
						ref={startRef}
						id={startId}
						selectsStart
						selected={toDate(range.start)}
						minDate={toDate(min) ?? undefined}
						placeholderText="시작일"
						onChange={(date: Date | null) => {
							const s = toValue(date);
							// 시작이 종료보다 늦으면 종료를 시작에 맞춘다
							const e = range.end && s > range.end ? s : range.end;
							commit({ start: s, end: e });
							// 종료가 비어 있으면 이어서 종료 칸을 연다
							if (s && !e) setTimeout(() => endRef.current?.setOpen(true), 0);
						}}
					>
						<QuickPicks picks={quick(() => startRef.current?.setOpen(false))} />
					</ReactDatePicker>
				</div>
				<span className="tilde" aria-hidden>
					~
				</span>
				<div className="control">
					<label htmlFor={endId} className="sr-only">
						{endLabel}
					</label>
					<LuCalendar className="calendar-icon" aria-hidden />
					<ReactDatePicker
						{...common}
						ref={endRef}
						id={endId}
						selectsEnd
						selected={toDate(range.end)}
						minDate={toDate(range.start) ?? toDate(min) ?? undefined}
						placeholderText="종료일"
						onChange={(date: Date | null) => commit({ start: range.start || toValue(date), end: toValue(date) })}
					>
						<QuickPicks picks={quick(() => endRef.current?.setOpen(false))} />
					</ReactDatePicker>
				</div>
			</div>
		</StyledDatePicker>
	);
}

export default DatePicker;

/** 고른 칸에 올렸을 때: 강조색을 조금 짙게 (흰 글자 대비 유지) */
const hoverPrimary = css`
	${({ theme }) => `color-mix(in srgb, ${theme.color.primary} 82%, #000)`}
`;

/** 달력 모양: 얇은 테두리 · 8px 모서리 · 그림자 없음 · 선택은 강조색, 기간은 옅은 강조색 */
const calendar = css`
	/* 헤더(1000) · 시트(1000)보다 위 */
	.react-datepicker-popper {
		z-index: 1001;
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
		/* 달 · 연도 고르기를 열면 '‹ 2026년 10월 ›' 줄은 감추고 그 자리부터 덮는다 (패널에 자기 머리가 있음) */
		.panel-open > .nav,
		.panel-open > .title {
			visibility: hidden;
		}

		.np-panel {
			position: absolute;
			inset: 0;
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

			/* 고른 칸에 올리면 회색이 아니라 조금 짙은 강조색 (흰 글자가 묻히지 않게) */
			&.current:hover:not(:disabled) {
				background: ${hoverPrimary};
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
		}

		/*
		 * 올렸을 때 (상태마다 글자가 묻히지 않게):
		 * 보통 날 → 옅은 회색 · 기간 안 → 조금 짙은 옅은 강조색 · 고른 날(시작 · 끝) → 조금 짙은 강조색 + 흰 글자
		 */
		.react-datepicker__day:hover {
			background: ${({ theme }) => theme.color.neutral};
			color: ${({ theme }) => theme.color.text};
		}

		/* 일요일 */
		.react-datepicker__week
			> .react-datepicker__day:first-child:not(.react-datepicker__day--selected):not(
				.react-datepicker__day--outside-month
			) {
			color: ${({ theme }) => theme.color.error};
		}

		.react-datepicker__day--today {
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			box-shadow: inset 0 0 0 1px ${({ theme }) => theme.color.border};
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

			&:hover {
				background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 26%, transparent);
			}
		}

		.react-datepicker__day--selected,
		.react-datepicker__day--range-start,
		.react-datepicker__day--range-end,
		.react-datepicker__day--selecting-range-start {
			background: ${({ theme }) => theme.color.primary};
			color: #ffffff;

			&:hover {
				background: ${hoverPrimary};
				color: #ffffff;
			}
		}

		/* 키보드로 옮겨 다니는 칸: 채우지 않고 테두리만 (고른 날과 헷갈리지 않게) */
		.react-datepicker__day--keyboard-selected:not(.react-datepicker__day--selected):not(
				.react-datepicker__day--range-start
			):not(.react-datepicker__day--range-end) {
			background: transparent;
			box-shadow: inset 0 0 0 2px ${({ theme }) => theme.color.primary};
		}
		/* 앞 · 뒤 달 날짜는 흐린 글자만: 기간 · 선택 색을 칠하지 않는다 (지금 달 안의 기간만 보이게, 경계에서 색이 섞이지 않게) */
		.react-datepicker__day.react-datepicker__day--outside-month {
			background: transparent;
			box-shadow: none;
			color: ${({ theme }) => theme.color.disabled};
			font-weight: inherit;

			&:hover {
				background: ${({ theme }) => theme.color.neutral};
			}
		}
	}

	/* 라이브러리 기본은 폭 13.8rem 고정이라 달력 폭만큼 펴 준다 */
	.react-datepicker__children-container {
		clear: both;
		width: auto;
		height: auto;
		margin: 0;
		padding: 0;
	}

	/* 달력 아래 빠른 선택: 얇은 테두리 칩, 고를 수 없는 건 흐리게 */
	.np-quick {
		/* 달 칸(float)의 아래로 */
		clear: both;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		width: 100%;
		margin-top: 0.375rem;
		padding-top: 0.5rem;
		border-top: 1px solid ${({ theme }) => theme.color.border};

		button {
			padding: 0.25rem 0.5rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.chip};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&:hover:not(:disabled) {
				border-color: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.primary};
			}

			&:disabled {
				opacity: 0.4;
				cursor: default;
			}
		}
	}
`;

const StyledDatePicker = styled.div<{ $size: Size; $range?: boolean }>`
	display: flex;
	flex-direction: column;
	width: ${({ $size, $range }) => ($size === 'small' ? ($range ? 'fit-content' : '9.5rem') : '100%')};
	max-width: 100%;

	> label,
	.group-label {
		${fieldLabel}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	/* 기간: [시작] ~ [종료] */
	.range {
		display: flex;
		align-items: center;
		gap: 0.375rem;

		.control {
			/* 작은 칸은 폭을 못 박는다 (flex-basis만 주면 Safari가 바깥 줄의 폭을 0으로 잡아 줄이 바뀐다) */
			${({ $size }) =>
				$size === 'small'
					? css`
							flex: none;
							width: 9.5rem;
						`
					: css`
							flex: 1 1 0;
						`}
			min-width: 0;
		}
	}

	.tilde {
		flex-shrink: 0;
		color: ${({ theme }) => theme.color.subText};
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
`;

/** 달력 층 (body 아래): 달력 모양은 여기서만 */
const StyledCalendarLayer = styled.div`
	${calendar}
`;

const StyledTrigger = styled.span`
	display: inline-block;

	.react-datepicker-wrapper,
	.react-datepicker__input-container {
		display: inline;
	}

	/* 글자 그대로, 점선 밑줄로 누를 수 있다는 표시. 마우스를 올리면 강조색 */
	.date-trigger {
		padding: 0;
		font: inherit;
		font-variant-numeric: tabular-nums;
		color: inherit;
		text-decoration: underline;
		text-decoration-color: ${({ theme }) => theme.color.lightGrey};
		text-underline-offset: 0.25em;
		text-decoration-thickness: 1px;
		cursor: pointer;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
			text-decoration-color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 달력은 글자 크기와 무관하게 */
	.react-datepicker-popper {
		font-size: 1rem;
		font-weight: normal;
	}
`;
