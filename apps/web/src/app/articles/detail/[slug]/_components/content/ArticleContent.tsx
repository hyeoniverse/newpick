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
		border-radius: ${({ theme }) => theme.borderRadius.soft};
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
	 * api가 만드는 본문 구조 (#43): 여는 말 → 소식(번호 · 소제목 · 한 줄 핵심 · 포인트 · 왜 중요할까요?) → 맺는 말.
	 * 예전 뉴스레터는 모델이 넣은 인라인 스타일 그대로 보인다
	 */
	.newsletter {
		padding-top: 2rem;
		font-size: ${({ theme }) => theme.fontSize.medium};

		p {
			line-height: 1.8;
			color: ${({ theme }) => theme.color.mediumGrey};
		}

		.intro {
			margin-bottom: 2.5rem;
			color: ${({ theme }) => theme.color.text};
		}

		.story + .story {
			margin-top: 3rem;
			padding-top: 3rem;
			border-top: 1px solid ${({ theme }) => theme.color.border};
		}

		.story-index {
			display: block;
			margin-bottom: 0.25rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			letter-spacing: 0.05em;
		}

		h2 {
			margin: 0 0 0.75rem;
			font-size: ${({ theme }) => theme.fontSize.large};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;
		}

		.lead {
			margin-bottom: 1.25rem;
			font-weight: ${({ theme }) => theme.fontWeight.medium};
			color: ${({ theme }) => theme.color.text};
		}

		.points {
			margin: 0 0 1.5rem;
			padding: 0;
			list-style: none;

			li {
				position: relative;
				margin-bottom: 0.5rem;
				padding-left: 1.25rem;
				line-height: 1.7;
				color: ${({ theme }) => theme.color.mediumGrey};

				&::before {
					content: '';
					position: absolute;
					left: 0.25rem;
					top: 0.7em;
					width: 0.4rem;
					height: 0.4rem;
					border-radius: 50%;
					background: ${({ theme }) => theme.color.primary};
				}
			}
		}

		.why {
			padding: 1.25rem 1.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.soft};
			border-left: 3px solid ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.surface};

			strong {
				display: block;
				margin-bottom: 0.5rem;
				font-size: ${({ theme }) => theme.fontSize.small};
				color: ${({ theme }) => theme.color.primary};
			}

			p:last-child {
				margin-bottom: 0;
			}
		}

		.outro {
			margin-top: 3rem;
			padding-top: 1.5rem;
			border-top: 1px dashed ${({ theme }) => theme.color.border};
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
		}
	}
`;

export default ArticleContent;
