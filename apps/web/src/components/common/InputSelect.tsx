'use client';

import React, { useState, useRef, useCallback, useEffect, useId } from 'react';
import { LuChevronDown, LuCheck } from 'react-icons/lu';

interface Props {
	id?: string;
	name: string;
	label?: string;
	value: string;
	options: { label: string; value: string }[];
	onChange: (value: string) => void;
	onBlur?: (name: string, value: string) => void;
	placeholder?: string;
	children?: React.ReactNode;
	/** small: 거르기 칩 줄 옆에 놓는 작은 칸 (높이 2rem · 둥근 모서리 · 글자 폭만큼). 기본은 입력칸 크기 */
	size?: 'medium' | 'small';
	/** 이름표 없이 쓸 때 화면 읽기용 이름 (예: '정렬') */
	ariaLabel?: string;
	className?: string;
}

/**
 * 선택 목록. 다른 입력칸과 같은 모양이고, 펼친 목록은 테두리·그림자로 아래 내용과 구분한다.
 * 키보드: Enter·Space·↓로 열고, ↑↓로 고르고, Enter로 정하고, Esc로 닫는다
 */
const InputSelect: React.FC<Props> = ({
	id,
	name,
	value,
	label,
	options,
	onChange,
	onBlur,
	placeholder = '선택하십시오',
	children,
	size = 'medium',
	ariaLabel,
	className,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [active, setActive] = useState(-1);
	const selectRef = useRef<HTMLDivElement>(null);
	const autoId = useId();
	const buttonId = id ?? autoId;
	const listId = `${buttonId}-list`;
	const selected = options.find((option) => option.value === value);

	const open = () => {
		setActive(
			Math.max(
				0,
				options.findIndex((option) => option.value === value),
			),
		);
		setIsOpen(true);
	};

	const close = useCallback(() => {
		if (onBlur) onBlur(name, value);
		setIsOpen(false);
	}, [name, onBlur, value]);

	const choose = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
				e.preventDefault();
				open();
			}
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActive((i) => Math.min(options.length - 1, i + 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActive((i) => Math.max(0, i - 1));
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (options[active]) choose(options[active].value);
		} else if (e.key === 'Tab') {
			close();
		}
	};

	const handleClickOutside = useCallback(
		(e: MouseEvent) => {
			if (isOpen && selectRef.current && !selectRef.current.contains(e.target as Node)) close();
		},
		[isOpen, close],
	);

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [handleClickOutside]);

	return (
		<div ref={selectRef} data-open={isOpen || undefined} className={`np-select ${size} ${className ?? ''}`}>
			{label && (
				<label htmlFor={buttonId} className="np-field-label">
					{label}
				</label>
			)}
			<button
				id={buttonId}
				type="button"
				name={name}
				className={`np-field-control select-display ${selected ? '' : 'placeholder'}`}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-controls={listId}
				aria-label={label ? undefined : ariaLabel}
				onClick={() => (isOpen ? close() : open())}
				onKeyDown={handleKeyDown}
			>
				<span>{selected?.label ?? placeholder}</span>
				<LuChevronDown className="select-arrow" aria-hidden />
			</button>
			<ul id={listId} className="options-list" role="listbox" aria-label={label ?? ariaLabel ?? placeholder}>
				{options.map((option, i) => (
					<li
						key={option.value}
						role="option"
						aria-selected={option.value === value}
						className={`option-item ${option.value === value ? 'selected' : ''} ${i === active ? 'active' : ''}`}
						onMouseEnter={() => setActive(i)}
						// 버튼에서 초점이 빠져 목록이 먼저 닫히지 않게
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => choose(option.value)}
					>
						{option.label}
						{option.value === value && <LuCheck aria-hidden />}
					</li>
				))}
			</ul>
			{children}
		</div>
	);
};

export default InputSelect;
