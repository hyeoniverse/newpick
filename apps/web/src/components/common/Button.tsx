'use client';

import React from 'react';
import styled from 'styled-components';
import { ButtonScheme, ButtonSize } from '@/styles/theme';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children?: React.ReactNode;
	ref?: React.Ref<HTMLButtonElement>;
	size?: ButtonSize;
	scheme?: ButtonScheme;
	disabled?: boolean;
	isLoading?: boolean;
	icon?: React.ReactNode;
	iconPosition?: 'left' | 'right';
	tooltip?: string;
}

const Button = ({
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
			title={textContent}
			ref={ref}
			size={size}
			scheme={scheme}
			disabled={disabled}
			isLoading={isLoading}
			data-tooltip={tooltip}
			iconPosition={iconPosition}
			{...props}
		>
			{icon && iconPosition === 'left' && <span>{icon}</span>}
			{children}
			{icon && iconPosition === 'right' && <span>{icon}</span>}
		</StyledButton>
	);
};

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
  font-weight: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].fontWeight};
	padding: ${({ theme, size }) => theme.button[size ?? 'small'].padding};
	gap: ${({ theme, size }) => theme.button[size ?? 'small'].gap};

	color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].secondary};
	background: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].background};
	border: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].border};
	border-radius: ${({ theme }) => theme.borderRadius.flat};
	opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
	pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
	cursor: ${({ disabled }) => (disabled ? 'none' : 'pointer')};

	white-space: nowrap;
	text-overflow: ellipsis;
	-webkit-tap-highlight-color: transparent;

	a {
		text-decoration: none;
		color: inherit;
		padding: 0;
		margin: 0;
	}

	svg {
		width: ${({ theme, size }) => theme.button[size ?? 'small'].fontSize}
		height: ${({ theme, size }) => theme.button[size ?? 'small'].fontSize}
		font-size: ${({ theme, size }) => theme.button[size ?? 'small'].fontSize};
		color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].color};

    display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
    padding: 0;
    margin: 0;

    transform: scale(1.25);
	}

	&:hover {
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
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		box-shadow: ${({ theme }) => theme.shadow.soft};

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
