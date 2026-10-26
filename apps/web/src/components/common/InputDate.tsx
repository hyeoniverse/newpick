'use client';

import { useId, useState } from 'react';
import styled from 'styled-components';
import { fieldControl, fieldLabel } from '@/components/common/field';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Props {
	label?: string;
	onChange: (date: Date | null) => void;
	onBlur?: () => void;
}

const InputDate = ({ label, onChange, onBlur }: Props) => {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	// 한 화면에 여러 개 있어도 이름표가 제 칸을 가리키게
	const inputId = useId();

	const handleDateChange = (date: Date | null) => {
		setSelectedDate(date);
		onChange(date);
	};

	return (
		<StyledInputDate>
			{label && <label htmlFor={inputId}>{label}</label>}
			<DatePicker
				id={inputId}
				className="custom-datepicker"
				selected={selectedDate}
				onChange={handleDateChange}
				showYearDropdown
				yearDropdownItemNumber={130}
				scrollableYearDropdown
				dateFormat="yyyy-MM-dd"
				placeholderText="날짜를 선택하세요"
				closeOnScroll={true}
				shouldCloseOnSelect={true}
				maxDate={new Date()}
				onBlur={onBlur}
			/>
		</StyledInputDate>
	);
};

/** 다른 입력칸과 같은 모양 (이름표 위, 같은 높이·모서리). 달력은 테마 색 */
const StyledInputDate = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;

	label {
		${fieldLabel}
	}

	.react-datepicker-wrapper,
	.react-datepicker__input-container {
		display: block;
		width: 100%;
	}

	.custom-datepicker {
		${fieldControl}
	}

	.react-datepicker-popper {
		z-index: 20;
	}

	.react-datepicker {
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		color: ${({ theme }) => theme.color.text};
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		font-family: inherit;
		overflow: hidden;
	}

	.react-datepicker__day {
		color: ${({ theme }) => theme.color.text};
	}

	.react-datepicker__day--disabled {
		color: ${({ theme }) => theme.color.disabled};
	}

	.react-datepicker__header {
		background-color: ${({ theme }) => theme.color.secondary};
		color: ${({ theme }) => theme.color.background};
		border-bottom: none;
	}

	.react-datepicker__current-month,
	.react-datepicker-time__header {
		font-size: ${({ theme }) => theme.fontSize.medium};
		color: ${({ theme }) => theme.color.background};
	}

	.react-datepicker__day-name {
		color: ${({ theme }) => theme.color.background};
	}

	.react-datepicker__day--selected,
	.react-datepicker__day--keyboard-selected {
		background-color: ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.background};
		border-radius: ${({ theme }) => theme.radius.control};
	}

	.react-datepicker__day:hover {
		background-color: ${({ theme }) => theme.color.secondary};
		color: ${({ theme }) => theme.color.background};
	}

	.react-datepicker__year-dropdown,
	.react-datepicker__month-dropdown {
		background-color: ${({ theme }) => theme.color.background};
		color: ${({ theme }) => theme.color.text};
		border: 1px solid ${({ theme }) => theme.color.border};
	}

	.react-datepicker__year-option:hover,
	.react-datepicker__month-option:hover {
		background-color: ${({ theme }) => theme.color.secondary};
		color: ${({ theme }) => theme.color.background};
	}
`;

export default InputDate;
