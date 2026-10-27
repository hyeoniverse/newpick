'use client';

import { useEffect, useId, useState } from 'react';
import styled, { css } from 'styled-components';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { LuCalendar } from 'react-icons/lu';
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
					dateFormatCalendar="yyyy년 M월"
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
					dateFormatCalendar="yyyy년 M월"
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

		.react-datepicker__header {
			padding: 0.25rem 0 0.5rem;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			background: transparent;
		}

		.react-datepicker__current-month {
			margin-bottom: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
		}

		.react-datepicker__navigation {
			top: 0.625rem;
		}

		.react-datepicker__navigation-icon::before {
			border-color: ${({ theme }) => theme.color.subText};
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

		.react-datepicker__day {
			border-radius: ${({ theme }) => theme.radius.surface};
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

		.react-datepicker__day--in-range,
		.react-datepicker__day--in-selecting-range {
			border-radius: 0;
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 14%, transparent);
			color: ${({ theme }) => theme.color.text};
		}

		.react-datepicker__day--selected,
		.react-datepicker__day--range-start,
		.react-datepicker__day--range-end,
		.react-datepicker__day--selecting-range-start,
		.react-datepicker__day--keyboard-selected {
			border-radius: ${({ theme }) => theme.radius.surface};
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
