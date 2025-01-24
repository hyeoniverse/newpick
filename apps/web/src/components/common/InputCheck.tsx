'use client';

import React from 'react';
import { useInputCheck } from '@/hooks/useInputCheck';

import styled from 'styled-components';
import { FontSize } from '@/styles/theme';
import { BiCheck } from 'react-icons/bi';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onBlur' | 'onChange' | 'size'> {
	name: string;
	label?: string;
	size?: FontSize;
}
const InputCheck = React.forwardRef<HTMLInputElement, Props>(({ size, label, name, ...props }, ref) => {
	const { isChecked, toggleChecked } = useInputCheck(name);

	const handleChange = () => {
		toggleChecked();
	};

	return (
		<StyledInputCheck $size={size}>
			{label && <label>{label}</label>}
			<div className="input-check">
				<input type="checkbox" ref={ref} name={name} checked={isChecked} onChange={handleChange} {...props} />
				<span className="icon">
					<BiCheck />
				</span>
			</div>
		</StyledInputCheck>
	);
});

interface StyleProps {
	$size?: FontSize;
}

const StyledInputCheck = styled.div<StyleProps>`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	user-select: none;
	transition: all 0.3s ease;

	label {
		will-change: transform, opacity;
		visibility: hidden;
		opacity: 0;
		transform: translateY(0.5rem);
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
	}

	&:hover {
		label {
			visibility: visible;
			height: auto;
			opacity: 1;
			transform: translateY(0);
		}
	}

	.input-check {
		position: relative;
		cursor: pointer;

		&:hover {
			input {
				background: ${({ theme }) => theme.color.tertiary};
			}
		}
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
		border-radius: ${({ theme }) => theme.borderRadius.flat};
		background: ${({ theme }) => theme.color.background};
		border: 1px solid ${({ theme }) => theme.color.border};

		&:checked {
			background: ${({ theme }) => theme.color.primary};
		}

		&:checked + span svg {
			opacity: 1;
			visibility: visible;
		}
	}

	.icon {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;

		svg {
			opacity: 0;
			visibility: hidden;
			color: white;
			font-size: ${({ theme }) => theme.fontSize.medium};
			transition: opacity 0.2s ease, visibility 0.2s ease;
		}
	}
`;

InputCheck.displayName = 'InputCheck';
export default InputCheck;
