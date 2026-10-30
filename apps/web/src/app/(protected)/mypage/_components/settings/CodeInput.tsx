'use client';

import { useState } from 'react';
import styled from 'styled-components';

interface Props {
	id: string;
	value: string;
	onChange: (value: string) => void;
	/** 틀린 코드였을 때 칸을 빨갛게 */
	invalid?: boolean;
	length?: number;
	autoFocus?: boolean;
}

/**
 * 인증 코드 입력: 숫자 한 칸에 한 자리씩 보인다.
 * 실제 입력은 칸 위에 투명하게 겹친 input 하나라서 붙여넣기 · 휴대폰의 코드 자동 채우기(one-time-code) · 지우기가 그대로 된다
 */
export default function CodeInput({ id, value, onChange, invalid, length = 6, autoFocus }: Props) {
	const [focused, setFocused] = useState(false);
	const active = Math.min(value.length, length - 1);

	return (
		<StyledCodeInput className={invalid ? 'invalid' : undefined}>
			<input
				id={id}
				inputMode="numeric"
				autoComplete="one-time-code"
				pattern={`\\d{${length}}`}
				maxLength={length}
				required
				value={value}
				onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				aria-invalid={invalid || undefined}
				autoFocus={autoFocus}
			/>
			<div className="cells" aria-hidden>
				{Array.from({ length }, (_, i) => (
					<span key={i} className={`cell${focused && i === active ? ' active' : ''}`}>
						{value[i] ?? (focused && i === active ? <i className="caret" /> : null)}
					</span>
				))}
			</div>
		</StyledCodeInput>
	);
}

const StyledCodeInput = styled.div`
	position: relative;
	width: fit-content;

	/* 칸 전체를 덮는 투명한 입력: 눌러도 · 붙여 넣어도 여기로 */
	input {
		position: absolute;
		inset: 0;
		z-index: 1;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		color: transparent;
		caret-color: transparent;
		/* iOS가 확대하지 않게 16px 이상 */
		font-size: 16px;
		outline: none;

		&::selection {
			background: transparent;
		}
	}

	.cells {
		display: flex;
		gap: 0.5rem;
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 3.25rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.large};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.text};
		transition: border-color 0.15s ease;

		&.active {
			border-color: ${({ theme }) => theme.color.primary};
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			width: 2.5rem;
			height: 3rem;
		}
	}

	&.invalid .cell {
		border-color: ${({ theme }) => theme.color.error};
	}

	/* 비어 있는 지금 칸에 깜박이는 세로 막대 */
	.caret {
		width: 1px;
		height: 1.25rem;
		background: ${({ theme }) => theme.color.primary};
		animation: code-caret 1s steps(1) infinite;
	}

	@keyframes code-caret {
		50% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.caret {
			animation: none;
		}
	}
`;
