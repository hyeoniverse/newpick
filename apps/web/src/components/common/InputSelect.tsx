'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { IoMdArrowDropdown } from 'react-icons/io';

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

const InputSelect: React.FC<Props> = ({
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
	const selectRef = useRef<HTMLDivElement>(null);

	const handleToggle = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsOpen((prev) => !prev);
	};

	const handleOptionClick = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);

		if (!optionValue && onBlur) {
			onBlur(name, optionValue);
		}
	};

	const handleClickOutside = useCallback(
		(e: MouseEvent) => {
			if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
				if (isOpen) {
					if (onBlur) {
						onBlur(name, '');
					}
					setIsOpen(false);
				}
			}
		},
		[isOpen, name, onBlur]
	);

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [handleClickOutside]);

	return (
		<StyledInputSelect ref={selectRef} $open={isOpen}>
			{label && <label>{label}</label>}
			<div className="select-display" onClick={handleToggle}>
				{value ? options.find((option) => option.value === value)?.label || placeholder : placeholder}
				<IoMdArrowDropdown className={`select-arrow ${isOpen ? 'open' : ''}`} />
			</div>
			<ul className="options-list">
				{options.map((option) => (
					<li
						key={option.value}
						className={`option-item ${option.value === value ? 'selected' : ''}`}
						onClick={() => handleOptionClick(option.value)}
					>
						{option.label}
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

	.select-display {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		box-shadow: ${({ theme }) => theme.shadow.light};
		border-radius: ${({ theme }) => theme.borderRadius.default};
		background: ${({ theme }) => theme.color.blur};
		font-size: ${({ theme }) => theme.fontSize.small};
		cursor: pointer;
		line-height: 1.8;
		height: 2.5rem;
		z-index: 1000;

		.select-arrow {
			margin-left: 0.5rem;
			transition: transform 0.25s ease-in-out;
			font-size: ${({ theme }) => theme.fontSize.large};
			color: ${({ theme }) => theme.color.primary};

			&.open {
				transform: rotate(180deg);
			}
		}
	}

	.options-list {
		width: 100%;
		visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
		max-height: ${({ $open }) => ($open ? 'auto' : '0')};
		opacity: ${({ $open }) => ($open ? '1' : '0')};
		transform-origin: top;
		transform: ${({ $open }) => ($open ? 'scaleY(1)' : 'scaleY(0)')};
		transition: all 0.3s ease-in-out;

		position: absolute;
		top: 100%;
		max-height: 10rem;
		overflow-y: auto;
		margin: 0;
		padding: 0.5rem;

		list-style: none;
		box-shadow: ${({ theme }) => theme.shadow.default};
		border-radius: ${({ theme }) => theme.borderRadius.default};
		background: ${({ theme }) => theme.color.surface};
		z-index: 2000;

		.option-item {
			padding: 0.5rem 1rem;
			border-radius: ${({ theme }) => theme.borderRadius.default};
			cursor: pointer;
			margin: 0.5rem;
			white-space: nowrap;

			&.selected {
				background: ${({ theme }) => theme.color.blur};
				box-shadow: ${({ theme }) => theme.shadow.light};
			}

			&:hover {
				background: ${({ theme }) => theme.color.secondary};
				box-shadow: ${({ theme }) => theme.shadow.light};
			}
		}
	}
`;

export default InputSelect;
