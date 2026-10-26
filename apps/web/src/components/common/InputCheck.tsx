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
/**
 * 체크 상자. 이름표는 상자 오른쪽에 항상 보이고, 이름표를 눌러도 체크된다.
 * 예전에는 이름표가 마우스를 올려야 위에 나타나 무엇을 체크하는지 알 수 없었다
 */
const InputCheck = React.forwardRef<HTMLInputElement, Props>(({ size, label, name, className, ...props }, ref) => {
	const { isChecked, toggleChecked } = useInputCheck(name);

	return (
		<StyledInputCheck $size={size} className={className}>
			<span className="input-check">
				<input type="checkbox" ref={ref} name={name} checked={isChecked} onChange={toggleChecked} {...props} />
				<span className="icon" aria-hidden>
					<BiCheck />
				</span>
			</span>
			{label && <span className="text">{label}</span>}
		</StyledInputCheck>
	);
});

interface StyleProps {
	$size?: FontSize;
}

const StyledInputCheck = styled.label<StyleProps>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	user-select: none;
	cursor: pointer;

	.text {
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.text};
	}

	.input-check {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
	}

	input {
		display: block;
		width: ${({ $size, theme }) => ($size ? theme.fontSize[$size] : theme.fontSize.large)};
		height: ${({ $size, theme }) => ($size ? theme.fontSize[$size] : theme.fontSize.large)};
		margin: 0;
		appearance: none;
		cursor: pointer;
		border: 1.5px solid ${({ theme }) => theme.color.lightGrey};
		border-radius: ${({ theme }) => theme.borderRadius.soft};
		background: ${({ theme }) => theme.color.background};
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease;

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 3px color-mix(in srgb, ${({ theme }) => theme.color.primary} 25%, transparent);
		}

		&:checked {
			border-color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.primary};
		}

		&:checked + .icon svg {
			opacity: 1;
			transform: scale(1);
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}
	}

	.icon {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;

		svg {
			opacity: 0;
			transform: scale(0.6);
			/* 체크된 상자(강조색) 위의 표시라 배경색으로: 다크 모드에서도 대비가 맞다 */
			color: ${({ theme }) => theme.color.background};
			font-size: ${({ theme }) => theme.fontSize.medium};
			transition:
				opacity 0.15s ease,
				transform 0.15s ease;
		}
	}
`;

InputCheck.displayName = 'InputCheck';
export default InputCheck;
