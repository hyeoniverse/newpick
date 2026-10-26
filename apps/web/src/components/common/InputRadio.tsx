'use client';

import React from 'react';
import styled from 'styled-components';
import { fieldLabel } from '@/components/common/field';

interface Props<T extends string> {
	name: string;
	/** 묶음 이름 (fieldset legend) */
	label?: string;
	value: T;
	options: { label: string; value: T }[];
	onChange: (value: T) => void;
	className?: string;
}

/**
 * 라디오 버튼 묶음: 여러 개 중 하나만 고른다. 체크 상자(InputCheck)와 같은 모양·크기.
 * 진짜 <input type="radio">라 ←→↑↓로 옮겨 고를 수 있다
 */
export default function InputRadio<T extends string>({ name, label, value, options, onChange, className }: Props<T>) {
	return (
		<StyledInputRadio className={className}>
			{label && <legend>{label}</legend>}
			<div className="options">
				{options.map((option) => (
					<label key={option.value} className="option">
						<input
							type="radio"
							name={name}
							value={option.value}
							checked={option.value === value}
							onChange={() => onChange(option.value)}
						/>
						<span className="text">{option.label}</span>
					</label>
				))}
			</div>
		</StyledInputRadio>
	);
}

const StyledInputRadio = styled.fieldset`
	margin: 0;
	padding: 0;
	border: none;
	min-width: 0;

	legend {
		${fieldLabel}
		padding: 0;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
	}

	.option {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
	}

	.text {
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.text};
	}

	input {
		flex-shrink: 0;
		display: grid;
		place-content: center;
		width: 1.25rem;
		height: 1.25rem;
		margin: 0;
		appearance: none;
		cursor: pointer;
		border: 1.5px solid ${({ theme }) => theme.color.lightGrey};
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		background: ${({ theme }) => theme.color.background};
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;

		/* 고른 표시: 가운데 점 */
		&::before {
			content: '';
			width: 0.625rem;
			height: 0.625rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.primary};
			transform: scale(0);
			transition: transform 0.15s ease;
		}

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
		}

		&:checked {
			border-color: ${({ theme }) => theme.color.primary};

			&::before {
				transform: scale(1);
			}
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 3px color-mix(in srgb, ${({ theme }) => theme.color.primary} 25%, transparent);
		}
	}
`;
