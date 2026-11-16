'use client';

import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import CalendarHeader from './CalendarHeader';
import CalendarLayer from './CalendarLayer';
import { toDate, toValue, type DateString } from './shared';

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
		<span className={`np-date-trigger ${className ?? ''}`}>
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
		</span>
	);
}
