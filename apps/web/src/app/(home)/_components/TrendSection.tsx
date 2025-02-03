'use client';

import { Suspense, lazy } from 'react';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';

import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Skeleton from '@/components/common/loader/Skeleton';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
const LazyCard = lazy(() => import('@/components/common/Card'));

interface Props {
	trends: IArticleSummary[];
}

const TrendSection = ({ trends = [] }: Props) => {
	const isLoading = trends.length === 0;

	return (
		<StyledTrendSection>
			<div className="trend-header">
				<Title size="extraSmall" weight="semiBold">
					오늘의 트렌드
				</Title>
			</div>
			{isLoading ? (
				<div className="placeholder">
					<Skeleton />
				</div>
			) : (
				<Suspense fallback={<Skeleton />}>
					<div className="trend-cards">
						{trends.map((trend) => (
							<LazyCard
								key={trend.id}
								data={{
									id: trend.id,
									url: `/articles/detail/${trend.id}`,
									image: trend.image,
									header: trend.categoryName,
									main: {
										title: trend.title,
										description: trend.summary,
									},
									footer: (
										<>
											<Text color="subText">{trend.date}</Text>
											<div className="right">
												<BookmarkIcon newsId={trend.id} newsletterId={trend.id} />
											</div>
										</>
									),
								}}
							/>
						))}
					</div>
				</Suspense>
			)}
		</StyledTrendSection>
	);
};

const StyledTrendSection = styled.section`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: flex-start;
	padding: 2rem 0;
	gap: 2rem;

	.placeholder {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.trend-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;

		button {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}
	}

	.trend-cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
		width: 100%;
		height: fit-content;
	}

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		flex-wrap: wrap;
	}
`;

export default TrendSection;
