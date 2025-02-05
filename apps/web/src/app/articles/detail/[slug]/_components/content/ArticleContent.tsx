'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { NewsInfo as INewsInfo } from '@/models/article.model';

import styled from 'styled-components';
import Text from '@/components/common/Text';
import SubscribeInduce from '@/app/articles/detail/[slug]/_components/content/SubscribeInduce';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import Skeleton from '@/components/common/loader/Skeleton';
import { getRelatedNews } from '@/hooks/useArticle';
import { dateFormatter } from '@/utils/formatter';
import { FaLink } from 'react-icons/fa';
const LazyCard = lazy(() => import('@/components/common/Card'));

interface NewsletterContentProps {
	content: string;
	flex?: number;
	className?: string;
	articleImage?: string;
	newsId?: number;
	related?: string[];
}

function ArticleContent({ content, flex, className, articleImage, related = [] }: NewsletterContentProps) {
	const [relatedNewsData, setRelatedNewsData] = useState<INewsInfo[]>([]);

	// 비동기 데이터를 useEffect에서 처리
	useEffect(() => {
		const fetchData = async () => {
			if (related?.length > 0) {
				const data = await getRelatedNews(related);
		console.log("asdfasdfasdf",related?.length);
				setRelatedNewsData(data); // 상태 업데이트
			}
		};
		fetchData();
	}, [related]);

	return (
		<ContainerStyled flex={flex} className={className}>
			{articleImage && (
				<div className="image-wrapper">
					<HeightAutoImg src={articleImage} height={'auto'} />
				</div>
			)}
			<NewsletterContentStyled>
				<div dangerouslySetInnerHTML={{ __html: content }} />
				<div className="content-bottom-margin" />
			</NewsletterContentStyled>
			<hr />
			<Suspense fallback={<Skeleton />}>
				<div className="related-news">
					<div className="header">
						<FaLink />
						<Text size="medium" weight="semiBold">
							관련 뉴스
						</Text>
					</div>
					{relatedNewsData.map((news) => (
						<LazyCard
							className="card"
							type="list"
							newTab={true}
							key={news.link}
							data={{
								id: news.id,
								url: news.link,
								image: news.images[0],
								header: news.category[0],
								main: {
									title: news.title,
									description: news.content,
								},
								footer: (
									<>
										<Text color="subText">{dateFormatter(news.publishedAt)}</Text>
									</>
								),
							}}
						/>
					))}
				</div>
			</Suspense>
			<SubscribeInduce />
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

	.related-news {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 2rem;
		margin-bottom: 4rem;

		.header {
			display: flex;
			flex-direction: row;
			align-items: center;
			margin: 0;
			padding: 0.5rem 1rem;
			gap: 0.5rem;

			border-radius: ${({ theme }) => theme.borderRadius.capsule};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
		}

		.card {
			background: ${({ theme }) => theme.color.surface};
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.borderRadius.soft};
			padding: 1rem;
			gap: 0;

			.card-header {
				display: none;
			}

			.card-body {
				border: none;
				margin: 0;
				padding: 0;
				display: flex;
				flex-direction: column;
				justify-content: flex-start;

				.content {
					padding: 0;
					margin: 0;
					gap: 1rem;
					border: none;

					.left {
						padding: 0;
						margin: 0;
					}
				}
			}
		}
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
`;

export default ArticleContent;
