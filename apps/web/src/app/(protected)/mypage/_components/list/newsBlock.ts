import { css } from 'styled-components';

/**
 * 원래 마이페이지의 '오늘의 뉴스레터' 블록 (내 뉴스레터 · 스크랩이 같이 씀):
 * 큰 제목(.news-title) → 왼쪽 그림(.news-image) · 그 아래 분야(.news-cats) · 동작(.news-icons) | 오른쪽 연한 상자(.news-summary)
 */
export const newsBlock = css`
	.news {
		padding: 1.75rem 0 2rem;
		scroll-margin-top: 6rem;
	}

	.news-title {
		display: block;
		margin-bottom: 1.5rem;
		padding: 0;
		text-align: left;
		color: inherit;
		cursor: pointer;

		h3 {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.large};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			line-height: 1.4;
			word-break: keep-all;
		}

		&:hover h3 {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.news-body {
		display: flex;
		gap: 1.25rem;
	}

	.news-media {
		flex: 1;
		min-width: 0;
	}

	.news-image {
		display: flex;
		width: 100%;
		padding: 0;
		cursor: pointer;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};

		> div {
			width: 100%;
		}

		> svg {
			width: 1.75rem;
			height: 1.75rem;
		}
	}

	/* 그림 아래 분야: 분류는 알약 모양(radius.chip) · 연보라 바탕 · 보라 글자 */
	.news-cats {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.375rem;
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;

		li {
			padding: 0.125rem 0.625rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.tertiary};
			font-size: 0.75rem;
			font-weight: ${({ theme }) => theme.fontWeight.medium};
			line-height: 1.5;
			color: ${({ theme }) => theme.color.primary};
			white-space: nowrap;
		}
	}

	/* 그림 아래 동작 (별 · 폴더 …) */
	.news-icons {
		align-items: center;
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	/* 오른쪽 연한 상자 */
	.news-summary {
		flex: 3;
		min-width: 0;
		padding: 1.25rem 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};
	}

	/* 좁은 화면: 그림 위 · 상자 아래 */
	@media ${({ theme }) => theme.mediaQuery.tablet} {
		.news-body {
			flex-direction: column;
		}

		.news-title h3 {
			font-size: ${({ theme }) => theme.fontSize.medium};
		}
	}
`;
