'use client';

import styled from 'styled-components';

interface Props {
	checked: boolean;
	onChange: (checked: boolean) => void;
	/** 화면 읽기 프로그램이 읽는 이름 (보이는 제목이 따로 있으면 aria-labelledby로) */
	label?: string;
	labelledBy?: string;
	disabled?: boolean;
}

/** 켜고 끄는 스위치: 누르면 바로 바뀐다 (저장 단추 없이). 키보드는 Space · Enter */
export default function Switch({ checked, onChange, label, labelledBy, disabled }: Props) {
	return (
		<StyledSwitch
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			aria-labelledby={labelledBy}
			disabled={disabled}
			$checked={checked}
			onClick={() => onChange(!checked)}
		>
			<span className="knob" aria-hidden />
		</StyledSwitch>
	);
}

const StyledSwitch = styled.button<{ $checked: boolean }>`
	position: relative;
	flex-shrink: 0;
	width: 2.75rem;
	height: 1.5rem;
	margin: 0;
	padding: 0;
	border: none;
	border-radius: 999px;
	background: ${({ theme, $checked }) => ($checked ? theme.color.primary : theme.color.border)};
	cursor: pointer;
	transition: background 0.2s ease;

	.knob {
		position: absolute;
		top: 0.1875rem;
		left: 0.1875rem;
		width: 1.125rem;
		height: 1.125rem;
		margin: 0;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		transform: translateX(${({ $checked }) => ($checked ? '1.25rem' : '0')});
		transition: transform 0.2s ease;
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.color.primary};
		outline-offset: 2px;
	}

	&:disabled {
		cursor: default;
		opacity: 0.5;
	}

	@media (prefers-reduced-motion: reduce) {
		&,
		.knob {
			transition: none;
		}
	}
`;
