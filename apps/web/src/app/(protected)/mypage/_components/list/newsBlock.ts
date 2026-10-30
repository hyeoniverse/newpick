import { css } from 'styled-components';

/**
 * 원래 마이페이지의 '오늘의 뉴스레터' 블록 (내 뉴스레터 · 스크랩이 같이 씀):
 * 큰 제목(.news-title, 동작이 있으면 .news-head로 감싸 오른쪽 끝에 .news-icons) → 왼쪽 그림(.news-image) · 그 아래 분야(.news-cats)
 * | 오른쪽 연한 상자(.news-summary)
 */
export const newsBlock = css`
	.news {
		/* 블록 폭을 재어 좁으면 제목 줄 동작을 위로 올린다 (화면이 아니라 블록 폭 기준) */
		container: news / inline-size;
		padding: 1.75rem 0 2rem;
		scroll-margin-top: 6rem;
	}

	/* 제목 + 오른쪽 끝 동작. 제목이 여러 줄이면 동작은 첫 줄 높이 가운데에 그대로 (제목 글줄 높이 = --title-line).
	   블록 폭이 많이 모자라면 동작은 제목 위 오른쪽 따로 한 줄로 (아래 @container) */
	.news-head {
		--title-line: calc(${({ theme }) => theme.fontSize.large} * 1.4);
		display: flex;
		align-items: flex-start;
		gap: 1.25rem;
		margin-bottom: 1.5rem;

		.news-title {
			flex: 1;
			min-width: 0;
			margin-bottom: 0;
		}
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

	/* 제목 오른쪽 끝 동작 (별 · 폴더 …): 제목 첫 줄과 같은 높이 안에서 가운데, 줄바꿈하지 않음 */
	.news-icons {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.5rem;
		height: var(--title-line);
		white-space: nowrap;

		/* 아이콘 단추 (별): 화면이 작아질수록 조금씩 작게 */
		> button {
			width: 2.5rem;
			height: 2.5rem;

			svg {
				width: 1.5rem;
				height: 1.5rem;
			}
		}

		.trigger {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}
	}

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		.news-icons {
			gap: 0.25rem;

			> button {
				width: 2.25rem;
				height: 2.25rem;

				svg {
					width: 1.375rem;
					height: 1.375rem;
				}
			}

			.trigger {
				font-size: 0.8125rem;
			}
		}
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

	/* 작은 화면: 블록 위아래 여백도 줄인다 (블록 자신은 @container로 못 바꿔 화면 폭으로) */
	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.news {
			padding: 1.125rem 0 1.25rem;
		}
	}

	/* 좁은 화면: 그림 위 · 상자 아래 */
	@media ${({ theme }) => theme.mediaQuery.tablet} {
		.news-body {
			flex-direction: column;
		}

		.news-title h3 {
			font-size: ${({ theme }) => theme.fontSize.medium};
		}

		.news-head {
			--title-line: calc(${({ theme }) => theme.fontSize.medium} * 1.4);
			gap: 0.75rem;
		}
	}

	/* 블록 폭이 많이 모자라면(작은 화면): 동작을 제목 위 오른쪽 끝 따로 한 줄로, 더 작게. 블록 안도 촘촘하게 */
	@container news (max-width: 28rem) {
		.news-head {
			--title-line: calc(${({ theme }) => theme.fontSize.small} * 1.4);
			margin-bottom: 0.75rem;
		}

		.news-title h3 {
			font-size: ${({ theme }) => theme.fontSize.small};
		}

		.news-body {
			gap: 0.75rem;
		}

		/* 그림은 폭 가득 그대로 (줄이는 건 상자 안 내용) */
		.news-cats {
			margin-top: 0.5rem;
		}

		.news-summary {
			padding: 0.875rem 1rem;
		}

		.news-head {
			flex-direction: column;
			align-items: stretch;
			gap: 0.125rem;
		}

		.news-icons {
			order: -1;
			align-self: flex-end;
			height: auto;
			/* 단추 안쪽 여백만큼 밀어 폴더 글자 끝을 제목 오른쪽 끝에 맞추고, 블록 위 여백 쪽으로 올려 붙인다 */
			margin: -0.75rem -0.25rem 0 0;

			> button {
				width: 2rem;
				height: 2rem;

				svg {
					width: 1.25rem;
					height: 1.25rem;
				}
			}

			.trigger {
				font-size: 0.75rem;
			}
		}
	}
`;
