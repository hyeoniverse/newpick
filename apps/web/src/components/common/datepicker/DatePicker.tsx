'use client';

import { useId, useRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { LuCalendar } from 'react-icons/lu';
import CalendarHeader from './CalendarHeader';
import CalendarLayer from './CalendarLayer';
import QuickPicks, { DAY_PICKS, type QuickPick } from './QuickPicks';
import { inRange, toDate, toValue, type CommonProps, type DateString } from './shared';

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
		<div className={`np-date-picker ${className ?? ''}`} data-size={size}>
			{label && (
				<label htmlFor={inputId} className="np-field-label">
					{label}
				</label>
			)}
			<div className="control">
				<LuCalendar className="calendar-icon" aria-hidden />
				<ReactDatePicker
					ref={pickerRef}
					id={inputId}
					locale="ko"
					className="np-field-control date-input"
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
		</div>
	);
}
