'use client';

import styled, { CSSProp } from 'styled-components';
import { ButtonScheme, ButtonSize } from '@/styles/theme';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	ref?: React.Ref<HTMLButtonElement>;
	size?: ButtonSize;
	scheme?: ButtonScheme;
	disabled?: boolean;
	isLoading?: boolean;
	styles?: string | CSSProp;
	tooltip?: string;
}

const Button = ({ children, ref, size, scheme, disabled, isLoading, tooltip, ...props }: Props) => {
	return (
		<StyledButton
			ref={ref}
			size={size}
			scheme={scheme}
			disabled={disabled}
			isLoading={isLoading}
			data-tooltip={tooltip}
			{...props}
		>
			{children}
		</StyledButton>
	);
};

export const StyledButton = styled.button.withConfig({
	shouldForwardProp: (prop) => !['isLoading', 'styles'].includes(prop),
})<Omit<Props, 'children'>>`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	line-height: 1;
	width: 100%;

	font-size: ${({ theme, size }) => theme.button[size ?? 'small'].fontSize};
	padding: ${({ theme, size }) => theme.button[size ?? 'small'].padding};
	gap: ${({ theme, size }) => theme.button[size ?? 'small'].gap};

	color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].color};
	background: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].background};
	border: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].border};
	border-radius: ${({ theme }) => theme.borderRadius.flat};
	opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
	pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
	cursor: ${({ disabled }) => (disabled ? 'none' : 'pointer')};

	white-space: nowrap;
	text-overflow: ellipsis;
	transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
	-webkit-tap-highlight-color: transparent;

	svg {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		width: calc(${({ theme, size }) => theme.button[size ?? 'small'].fontSize} * 1.2);
		height: calc(${({ theme, size }) => theme.button[size ?? 'small'].fontSize} * 1.2);

		&:hover {
			color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.color};
			background: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.background};
		}
	}

	&:hover {
		color: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.color};
		background: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.background};
		border: ${({ theme, scheme }) => theme.buttonScheme[scheme ?? 'default'].hover.border};
		// font-weight: ${({ theme }) => theme.fontWeight.semiBold};
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
		color: ${({ theme }) => theme.color.lightGrey};
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

	${({ styles }) => styles || ''}
`;

export default Button;
