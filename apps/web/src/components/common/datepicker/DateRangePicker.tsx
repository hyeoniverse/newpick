'use client';

import { useEffect, useId, useRef, useState } from 'react';
import ReactDatePicker, { type ReactDatePickerCustomHeaderProps } from 'react-datepicker';
import { LuCalendar } from 'react-icons/lu';
import CalendarHeader from './CalendarHeader';
import CalendarLayer from './CalendarLayer';
import QuickPicks, { RANGE_PICKS, type QuickPick } from './QuickPicks';
import { inRange, toDate, toValue, type CommonProps, type DateString } from './shared';

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
		className: 'np-field-control date-input',
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
		<div className={`np-date-picker ${className ?? ''}`} data-size={size} data-range>
			{label && <span className="np-field-label group-label">{label}</span>}
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
		</div>
	);
}
