'use client';

import styled from 'styled-components';
import SubscribeInduce from '@/components/common/article/SubscribeInduce';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import OpenGraphCard from '@/components/common/article/OpenGraphCard';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

interface NewsletterContentProps {
	content: string;
	flex?: number;
	className?: string;
	articleImage?: string;
	newsId?: number;
	related?: string[];
}

function ArticleContent({ content, flex, className, articleImage, related = [] }: NewsletterContentProps) {
	return (
		<ContainerStyled flex={flex} className={className}>
			{articleImage && (
				<div className="image-wrapper">
					<HeightAutoImg src={articleImage} height={'auto'} />
				</div>
			)}
			<NewsletterContentStyled>
				<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
				<div className="content-bottom-margin" />
			</NewsletterContentStyled>
			<hr />
			<OpenGraphCardContainer>
				<OpenGraphCard urls={related} />
			</OpenGraphCardContainer>
			<SubscribeInduce className="subscribe" />
		</ContainerStyled>
	);
}

const ContainerStyled = styled.div<Omit<NewsletterContentProps, 'content'>>`
	position: relative;
	display: flex;
	flex-direction: column;
	height: 100%;
	max-width: 100%;

	hr {
		width: 100%;
		margin: 0;
		border: none;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
	}
`;

const OpenGraphCardContainer = styled.div`
	position: relative;
	gap: 0.5rem;

	.content-bottom-margin {
		padding-bottom: 2rem;
	}

	* {
		word-break: break-word;
		line-height: 1.56;
	}
`;

const NewsletterContentStyled = styled.article`
	position: relative;
	gap: 0.5rem;

	.content-bottom-margin {
		padding-bottom: 2rem;
	}

	* {
		margin-bottom: 0.5rem;
		word-break: break-word;
		line-height: 1.56;
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		margin-top: 2rem;
	}

	p {
		color: ${({ theme }) => theme.color.mediumGrey};
	}

	img {
		border-radius: ${({ theme }) => theme.radius.surface};
	}

	figure {
		margin: 0;
		width: 100%;

		img {
			margin-bottom: 0.25rem;
			width: 100%;
		}

		figcaption {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.lightGrey};
		}
	}

	a {
		color: ${({ theme }) => theme.color.primary};
		text-decoration: underline ${({ theme }) => theme.color.primary};
		text-decoration-thickness: 2px;
	}

	/*
	 * api가 만드는 본문 구조 (#43): 에디터 브리핑 → 소식(꼬리표 · 헤드라인 · 리드 · 템플릿별 요소 · 본문 · 시사점 · 출처) → 관전 포인트.
	 * 신문 지면처럼 굵은 구분선과 작은 대문자 라벨로 나눈다. 예전 뉴스레터는 모델이 넣은 인라인 스타일 그대로 보인다
	 */
	.newsletter {
		padding-top: 2rem;
		font-size: ${({ theme }) => theme.fontSize.medium};

		p {
			line-height: 1.8;
			color: ${({ theme }) => theme.color.mediumGrey};
		}

		/* 핵심 구절 형광펜 (#51): 글자 아래쪽 절반만 강조색을 옅게 칠한다 */
		mark {
			padding: 0 0.1em;
			background: linear-gradient(
				transparent 55%,
				color-mix(in srgb, ${({ theme }) => theme.color.primary} 22%, transparent) 55%
			);
			color: ${({ theme }) => theme.color.text};
			font-weight: ${({ theme }) => theme.fontWeight.medium};
		}

		h3 {
			margin: 0 0 0.75rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			letter-spacing: 0.08em;
			color: ${({ theme }) => theme.color.text};
		}

		ul {
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.briefing {
			margin-bottom: 3rem;
			padding: 1.25rem 0;
			border-top: 3px solid ${({ theme }) => theme.color.text};

			p {
				margin-bottom: 0;
				color: ${({ theme }) => theme.color.text};
			}
		}

		.story {
			padding-top: 1.5rem;
			border-top: 1px solid ${({ theme }) => theme.color.text};

			& + .story {
				margin-top: 3.5rem;
			}
		}

		.kicker {
			display: flex;
			gap: 0.5rem;
			margin-bottom: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};

			.index {
				color: ${({ theme }) => theme.color.subText};
			}
		}

		h2 {
			margin: 0 0 1rem;
			font-size: ${({ theme }) => theme.fontSize.extraLarge};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			line-height: 1.35;
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;
		}

		.lead {
			margin-bottom: 1.5rem;
			font-size: ${({ theme }) => theme.fontSize.large};
			font-weight: ${({ theme }) => theme.fontWeight.medium};
			line-height: 1.6;
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;
		}

		.body p {
			margin-bottom: 1rem;
		}

		/* 소식 사진 (#49): 원출처 또는 Pexels·Unsplash, 아래에 출처 */
		.story-image {
			margin: 0 0 1.5rem;

			img {
				display: block;
				width: 100%;
				aspect-ratio: 16 / 9;
				object-fit: cover;
				margin: 0;
				border-radius: ${({ theme }) => theme.borderRadius.soft};
				background: ${({ theme }) => theme.color.surface};
			}

			figcaption {
				margin-top: 0.5rem;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.subText};

				a {
					color: inherit;
					text-decoration: underline;
					text-decoration-thickness: 1px;
				}
			}
		}

		/* 템플릿별 고유 요소 (#48) */

		/* numbers: 지표 카드 */
		.stats {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
			gap: 1px;
			margin: 0 0 1.5rem;
			border-top: 2px solid ${({ theme }) => theme.color.text};
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			background: ${({ theme }) => theme.color.border};

			.stat {
				display: flex;
				flex-direction: column;
				gap: 0.25rem;
				/* 본문 공통 * { margin-bottom }이 카드 아래로 회색 띠를 만들지 않게 */
				margin: 0;
				padding: 1rem 0.75rem;
				background: ${({ theme }) => theme.color.background};
			}

			.label {
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.subText};
			}

			.value {
				font-size: ${({ theme }) => theme.fontSize.large};
				word-break: keep-all;
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				line-height: 1.2;
				color: ${({ theme }) => theme.color.text};
				font-variant-numeric: tabular-nums;
			}

			.note {
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				font-weight: ${({ theme }) => theme.fontWeight.medium};
				color: ${({ theme }) => theme.color.primary};
			}
		}

		/* timeline: 날짜별 경과 */
		.timeline {
			margin: 0 0 1.5rem;
			padding: 0 0 0 1.25rem;
			list-style: none;
			border-left: 2px solid ${({ theme }) => theme.color.border};

			li {
				position: relative;
				display: flex;
				gap: 1rem;
				padding: 0.5rem 0;
				line-height: 1.6;

				&::before {
					content: '';
					position: absolute;
					left: calc(-1.25rem - 5px);
					top: 0.95em;
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background: ${({ theme }) => theme.color.primary};
				}
			}

			time {
				flex: 0 0 5.5rem;
				font-size: ${({ theme }) => theme.fontSize.small};
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				color: ${({ theme }) => theme.color.text};
			}

			span {
				color: ${({ theme }) => theme.color.mediumGrey};
			}
		}

		/* qa: 문답 */
		.qa {
			margin: 1.5rem 0;

			dt {
				margin-top: 1.25rem;
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				color: ${({ theme }) => theme.color.text};

				&::before {
					content: 'Q. ';
					color: ${({ theme }) => theme.color.primary};
				}
			}

			dd {
				margin: 0.5rem 0 0;
				padding-bottom: 1.25rem;
				border-bottom: 1px solid ${({ theme }) => theme.color.border};
				line-height: 1.7;
				color: ${({ theme }) => theme.color.mediumGrey};
			}
		}

		/* quote: 인용문 */
		.quote {
			margin: 0 0 1.5rem;
			padding: 0.5rem 0 0.5rem 1.25rem;
			border-left: 4px solid ${({ theme }) => theme.color.primary};

			p {
				margin-bottom: 0.5rem;
				font-size: ${({ theme }) => theme.fontSize.large};
				font-weight: ${({ theme }) => theme.fontWeight.medium};
				line-height: 1.5;
				color: ${({ theme }) => theme.color.text};

				&::before {
					content: '“';
				}

				&::after {
					content: '”';
				}
			}

			cite {
				font-size: ${({ theme }) => theme.fontSize.small};
				font-style: normal;
				color: ${({ theme }) => theme.color.subText};

				&::before {
					content: '— ';
				}
			}
		}

		/* brief: 단신은 작게 */
		.story-brief {
			h2 {
				font-size: ${({ theme }) => theme.fontSize.large};
			}

			.lead {
				font-size: ${({ theme }) => theme.fontSize.medium};
			}
		}

		.analysis {
			margin-top: 1.5rem;

			p:last-child {
				margin-bottom: 0;
			}
		}

		.credit {
			margin-top: 1.25rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};

			/* 원문 링크: 본문 링크보다 조용하게 */
			a {
				color: ${({ theme }) => theme.color.subText};
				text-decoration: underline;
				text-decoration-thickness: 1px;
				text-underline-offset: 2px;

				&:hover {
					color: ${({ theme }) => theme.color.primary};
				}
			}
		}

		.watch {
			margin-top: 3.5rem;
			padding-top: 1.25rem;
			border-top: 3px solid ${({ theme }) => theme.color.text};

			li {
				position: relative;
				padding: 0.5rem 0 0.5rem 1rem;
				line-height: 1.6;
				color: ${({ theme }) => theme.color.mediumGrey};

				&::before {
					content: '';
					position: absolute;
					left: 0;
					top: 1.15em;
					width: 0.4rem;
					height: 2px;
					background: ${({ theme }) => theme.color.primary};
				}
			}
		}
	}
`;

export default ArticleContent;
