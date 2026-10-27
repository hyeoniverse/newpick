import { css } from 'styled-components';

/**
 * 입력칸 공통 모양 (InputText · InputSelect · DatePicker).
 * 이름표는 위, 칸은 같은 높이·모서리·배경, 안내 글자는 읽을 수 있는 회색, 초점은 강조색 테두리 + 옅은 띠
 */
export const fieldLabel = css`
	display: block;
	margin-bottom: 0.375rem;
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	font-weight: ${({ theme }) => theme.fontWeight.semiBold};
	color: ${({ theme }) => theme.color.text};
`;

export const fieldControl = css`
	width: 100%;
	height: 3rem;
	padding: 0 1rem;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.control};
	background: ${({ theme }) => theme.color.background};
	color: ${({ theme }) => theme.color.text};
	font-size: ${({ theme }) => theme.fontSize.small};
	line-height: 1.5;
	outline: none;
	transition:
		border-color 0.15s ease,
		box-shadow 0.15s ease;

	&::placeholder {
		color: ${({ theme }) => theme.color.lightGrey};
	}

	&:hover {
		border-color: ${({ theme }) => theme.color.lightGrey};
	}

	&:focus,
	&:focus-visible {
		border-color: ${({ theme }) => theme.color.primary};
		box-shadow: 0 0 0 3px color-mix(in srgb, ${({ theme }) => theme.color.primary} 18%, transparent);
	}

	&:disabled {
		background: ${({ theme }) => theme.color.surface};
		color: ${({ theme }) => theme.color.subText};
		cursor: not-allowed;
	}
`;
