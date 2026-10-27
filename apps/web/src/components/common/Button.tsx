'use client';

import React, { JSX } from 'react';
import styled, { keyframes } from 'styled-components';
import { LuLoaderCircle } from 'react-icons/lu';
import { ButtonScheme, ButtonSize } from '@/styles/theme';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	as?: keyof JSX.IntrinsicElements;
	ref?: React.Ref<HTMLButtonElement>;
	children?: React.ReactNode;
	size?: ButtonSize;
	scheme?: ButtonScheme;
	disabled?: boolean;
	isLoading?: boolean;
	icon?: React.ReactNode;
	iconPosition?: 'left' | 'right';
	tooltip?: string;
}

const Button = ({
	as = 'button',
	children,
	ref,
	size,
	scheme,
	disabled,
	isLoading,
	tooltip,
	icon,
	iconPosition = 'right',
	...props
}: Props) => {
	const textContent = React.Children.toArray(children)
		.filter((child) => typeof child === 'string')
		.join(' ');

	return (
		<StyledButton
			as={as}
			// 글자가 없는 아이콘 버튼은 빈 title을 달지 않는다. 이름은 aria-label로 준다 (#16)
			title={textContent || undefined}
			ref={ref}
			size={size}
			scheme={scheme}
			// 로딩 중에는 다시 누르지 못하게
			disabled={disabled || isLoading}
			aria-busy={isLoading || undefined}
			isLoading={isLoading}
			data-tooltip={tooltip}
			iconPosition={iconPosition}
			{...props}
		>
			{isLoading && <LuLoaderCircle className="spinner" aria-hidden />}
			{icon && iconPosition === 'left' && <span className="icon">{icon}</span>}
			{children}
			{icon && iconPosition === 'right' && <span className="icon">{icon}</span>}
		</StyledButton>
	);
};

const spin = keyframes`
	to {
		transform: rotate(360deg);
	}
`;

export const StyledButton = styled.button.withConfig({
	shouldForwardProp: (prop) => !['isLoading', 'iconPosition'].includes(prop),
})<Omit<Props, 'children'>>`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	line-height: 1;
	width: fit-content;
	height: fit-content;

	font-size: ${({ theme, size }) => theme.button[size ?? 'small'].fontSize};
	padding: ${({ theme, size }) => theme.button[size ?? 'small'].padding};
	gap: ${({ theme, size }) => theme.button[size ?? 'small'].gap};
  font-weight: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].fontWeight};

	color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].color};
	background: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].background};
	border: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].border};
	/* 버튼은 각지게 (뉴픽 버튼 모양). 둥글게 할 곳은 쓰는 쪽에서 덮어쓴다 (예: 체험하기·구독 버튼) */
	border-radius: ${({ theme }) => theme.borderRadius.flat};
	cursor: pointer;
	transition:
		background 0.15s ease,
		border-color 0.15s ease,
		color 0.15s ease;

	/* 예전에는 cursor: none이라 비활성 버튼 위에서 마우스 포인터가 사라졌다 */
	&:disabled {
		opacity: ${({ isLoading }) => (isLoading ? 0.8 : 0.45)};
		cursor: ${({ isLoading }) => (isLoading ? 'progress' : 'not-allowed')};
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.color.primary};
		outline-offset: 2px;
	}

	.spinner {
		animation: ${spin} 0.8s linear infinite;
	}

	white-space: nowrap;
	text-overflow: ellipsis;
	-webkit-tap-highlight-color: transparent;

	a {
		text-decoration: none;
		color: inherit;
		padding: 0;
		margin: 0;
	}

	/* 아이콘은 글자 높이(1em)에 맞춘다. 더 크면 아이콘이 있는 버튼만 키가 커진다 */
	svg {
		flex-shrink: 0;
		width: 1em;
		height: 1em;
		color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].color};
	}

	.icon {
		display: inline-flex;
		align-items: center;
	}

	/* 비활성일 때는 hover 모양을 주지 않는다 */
	&:hover:not(:disabled) {
		color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.color};
		background: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.background};
		border: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.border};
		font-weight: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.fontWeight};
    
		svg {
			color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.color};
		}
	}

	&[data-tooltip]:hover::after,
	&[data-tooltip]:focus::after {
		width: max-content;
		max-width: calc(60vw - 2rem);
		content: attr(data-tooltip);
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 0.5rem;
		padding: 1rem 1.5rem;

		line-height: 1.8;
		white-space: break-spaces;
		text-align: left;

		background: ${({ theme }) => theme.color.surface};
		color: ${({ theme }) => theme.color.neutral};
		font-size: ${({ theme }) => theme.fontSize.small};
		border-radius: ${({ theme }) => theme.radius.surface};
		box-shadow: ${({ theme }) => theme.shadow.light};

		opacity: 1;
		transform: scaleY(1);
		transition: all 0.3s ease;
	}

	&[data-tooltip]::after {
		pointer-events: none;
		opacity: 0;
		transform-origin: top;
		transform: scaleY(0);
	}
`;

export default Button;
