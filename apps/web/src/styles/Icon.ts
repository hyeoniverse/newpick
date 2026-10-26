import styled from 'styled-components';

/**
 * 아이콘 버튼 공통 (북마크·링크 복사 등). 원형, 마우스를 올리면 바탕이 서서히 찬다.
 * 아이콘 자체의 움직임은 아이콘마다 뜻에 맞게 따로 준다 (icons/Glyphs.tsx)
 */
export const IconStyled = styled.button.attrs({ type: 'button' })`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 2.5rem;
	height: 2.5rem;
	padding: 0;
	border: none;
	border-radius: ${({ theme }) => theme.borderRadius.circle};
	background-color: transparent;
	color: ${({ theme }) => theme.color.primary};
	cursor: pointer;
	transition: background-color 0.2s ease;

	svg {
		width: 1.5rem;
		height: 1.5rem;
		color: ${({ theme }) => theme.color.primary};
	}

	&:hover {
		background-color: ${({ theme }) => theme.color.tertiary};
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.color.primary};
		outline-offset: 2px;
	}
`;
