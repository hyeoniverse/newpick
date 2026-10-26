import styled, { keyframes } from 'styled-components';

/** 북마크를 눌러 켤 때 한 번 톡 튀어 오른다 */
const pop = keyframes`
	0% { transform: scale(1); }
	40% { transform: scale(1.3); }
	100% { transform: scale(1); }
`;

/**
 * 아이콘 버튼 공통 (북마크·링크 복사 등). 원형, 마우스를 올리면 바탕이 서서히 차고 아이콘이 살짝 커지며,
 * 누르는 동안 작아진다. 움직임 줄이기를 켠 사용자에게는 크기 변화를 주지 않는다
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
	cursor: pointer;
	transition: background-color 0.2s ease;

	svg {
		width: 1.5rem;
		height: 1.5rem;
		color: ${({ theme }) => theme.color.primary};
		transition: transform 0.2s ease;
	}

	&:hover {
		background-color: ${({ theme }) => theme.color.tertiary};

		svg {
			transform: scale(1.1);
		}
	}

	&:active svg {
		transform: scale(0.88);
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.color.primary};
		outline-offset: 2px;
	}

	/* 눌림 상태로 바뀌는 순간(북마크 켜기) 한 번 튄다 */
	&[aria-pressed='true'] svg {
		animation: ${pop} 0.35s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		svg,
		&:hover svg,
		&:active svg {
			transform: none;
			transition: none;
		}

		&[aria-pressed='true'] svg {
			animation: none;
		}
	}
`;
