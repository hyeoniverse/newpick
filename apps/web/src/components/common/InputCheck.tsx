'use client';

import React from 'react';
import styled from 'styled-components';
import { FontSize } from '@/styles/theme'; // Next.js의 절대 경로 기반으로 수정

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onBlur' | 'onChange' | 'size'> {
	size?: FontSize;
	label?: string;
	onBlur?: (name: string, checked: boolean) => void;
	onChange?: (name: string, checked: boolean) => void;
}

const InputCheck = React.forwardRef<HTMLInputElement, Props>(({ size, label, onBlur, onChange, ...props }, ref) => {
	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		if (onBlur) {
			onBlur(name, checked);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		if (onChange) {
			onChange(name, checked);
		}
	};

	return (
		<StyledInputCheck $size={size} className="input-check">
			{label && <label>{label}</label>}
			<input type="checkbox" ref={ref} onBlur={handleBlur} onChange={handleChange} {...props} />
		</StyledInputCheck>
	);
});

interface StyleProps {
	$size?: FontSize;
}

const StyledInputCheck = styled.div<StyleProps>`
	display: flex;
	flex-direction: column;
	align-items: center;
	cursor: pointer;
	user-select: none;

	label {
		will-change: transform, opacity;
		visibility: hidden;
		opacity: 0;
		transform: translateY(0.5rem);
		transition: all 0.3s ease;
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
	}

	&:hover label {
		visibility: visible;
		height: auto;
		opacity: 1;
		transform: translateY(0);
		transition: all 0.3s ease;
	}

	input {
		display: flex;
		align-items: center;
		justify-content: center;

		height: ${({ $size, theme }) => ($size ? theme.fontSize[$size] : theme.fontSize.large)};
		width: ${({ $size, theme }) => ($size ? theme.fontSize[$size] : theme.fontSize.large)};
		aspect-ratio: 1;

		cursor: pointer;
		appearance: none;
		border-radius: 8px;
		background: ${({ theme }) => theme.color.blur};
		border: 1px solid ${({ theme }) => theme.color.border};

		&:checked {
			background: ${({ theme }) => theme.color.primary};
		}

		&:focus {
			// box-shadow: ${({ theme }) => theme.shadow.default};
		}
	}
`;

InputCheck.displayName = 'InputCheck';
export default InputCheck;
