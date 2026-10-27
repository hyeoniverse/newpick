import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NewsInfo as INewsInfo } from '@/models/article.model';
import { dateFormatter } from '@/utils/formatter';
import { getRelatedNews } from '@/hooks/useArticle';

import { FaLink } from 'react-icons/fa';
import Text from '@/components/common/Text';
import Skeleton from '@/components/common/loader/Skeleton';
import { styled } from 'styled-components';
const LazyCard = lazy(() => import('@/components/common/Card'));

interface Props {
	urls: string[];
}

export default function OpenGraphCard({ urls }: Props) {
	// 주소 목록(내용)으로 캐시해, 화면이 다시 그려져도(스크롤 등) 다시 요청하지 않는다.
	// 예전에는 urls 배열이 그릴 때마다 새로 만들어져 useEffect가 매번 다시 요청했고,
	// API 요청 제한(429)에 걸린 요청이 빠지면서 카드가 떴다 사라졌다
	const { data: relatedNewsData = [] } = useQuery<INewsInfo[]>({
		queryKey: ['relatedNews', urls.join(',')],
		queryFn: () => getRelatedNews(urls),
		enabled: urls.length > 0,
		staleTime: 1000 * 60 * 30,
	});

	return (
		<Suspense fallback={<Skeleton />}>
			<StyledOpenGraphCard>
				<TagTitle>
					<FaLink />
					<Text size="medium" weight="semiBold">
						관련 뉴스
					</Text>
				</TagTitle>
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
							header: (
								<div className="news-header">
									<Text size="medium" weight="semiBold" color="primary">
										{news.category[0]}
									</Text>
									<Text size="medium" color="subText" className="source">
										{news.source}
									</Text>
								</div>
							),
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
			</StyledOpenGraphCard>
		</Suspense>
	);
}

const TagTitle = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	margin: 0;
	padding: 0.5rem 1rem;
	gap: 0.5rem;

	border-radius: ${({ theme }) => theme.radius.chip};
	background: ${({ theme }) => theme.color.tertiary};
	color: ${({ theme }) => theme.color.primary};
`;

const StyledOpenGraphCard = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	margin-top: 2rem;
	margin-bottom: 4rem;

	.card {
		background: ${({ theme }) => theme.color.surface};
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		padding: 1rem;
		gap: 0;

		.news-header {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			gap: 0.25rem;

			.source {
				padding: 0.1rem 1rem;
				border-radius: ${({ theme }) => theme.radius.chip};
				border: 1px solid ${({ theme }) => theme.color.border};
			}

			.bar {
				width: 1px;
				height: ${({ theme }) => theme.fontSize.medium};
				border-left: 1px solid ${({ theme }) => theme.color.subText};
				margin: 0 0.5rem;
			}
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
`;
