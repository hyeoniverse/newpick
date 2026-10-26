'use client';

import React, { useState, useRef, useCallback, useEffect, useId } from 'react';
import styled from 'styled-components';
import { LuChevronDown, LuCheck } from 'react-icons/lu';
import { fieldControl, fieldLabel } from '@/components/common/field';

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
	placeholder = '선택하세요',
	children,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [active, setActive] = useState(-1);
	const selectRef = useRef<HTMLDivElement>(null);
	const autoId = useId();
	const buttonId = id ?? autoId;
	const listId = `${buttonId}-list`;
	const selected = options.find((option) => option.value === value);

	const open = () => {
		setActive(Math.max(0, options.findIndex((option) => option.value === value)));
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
		<StyledInputSelect ref={selectRef} $open={isOpen}>
			{label && <label htmlFor={buttonId}>{label}</label>}
			<button
				id={buttonId}
				type="button"
				name={name}
				className={`select-display ${selected ? '' : 'placeholder'}`}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-controls={listId}
				onClick={() => (isOpen ? close() : open())}
				onKeyDown={handleKeyDown}
			>
				<span>{selected?.label ?? placeholder}</span>
				<LuChevronDown className="select-arrow" aria-hidden />
			</button>
			<ul id={listId} className="options-list" role="listbox" aria-label={label ?? placeholder}>
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
		</StyledInputSelect>
	);
};

interface StyleProps {
	$open: boolean;
}

const StyledInputSelect = styled.div<StyleProps>`
	position: relative;
	width: 100%;

	label {
		${fieldLabel}
	}

	.select-display {
		${fieldControl}
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		text-align: left;
		cursor: pointer;

		&.placeholder span {
			color: ${({ theme }) => theme.color.lightGrey};
		}

		${({ $open, theme }) =>
			$open &&
			`border-color: ${theme.color.primary};
			box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.color.primary} 18%, transparent);`}

		.select-arrow {
			flex-shrink: 0;
			width: 1.125rem;
			height: 1.125rem;
			color: ${({ theme }) => theme.color.subText};
			transition: transform 0.2s ease;
			transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
		}
	}

	.options-list {
		position: absolute;
		top: calc(100% + 0.375rem);
		left: 0;
		z-index: 20;
		width: 100%;
		max-height: 16rem;
		margin: 0;
		padding: 0.375rem;
		overflow-y: auto;
		list-style: none;

		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

		visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
		opacity: ${({ $open }) => ($open ? 1 : 0)};
		transform: translateY(${({ $open }) => ($open ? '0' : '-0.25rem')});
		transition:
			opacity 0.15s ease,
			transform 0.15s ease,
			visibility 0.15s;
	}

	.option-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.75rem;
		border-radius: ${({ theme }) => theme.radius.control};
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.text};
		white-space: nowrap;
		cursor: pointer;

		svg {
			width: 1rem;
			height: 1rem;
			color: ${({ theme }) => theme.color.primary};
		}

		&.active {
			background: ${({ theme }) => theme.color.surface};
		}

		&.selected {
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}
	}
`;

export default InputSelect;
