'use client';

import { ROUTES } from '@/constants/routes';
import { Suspense, lazy } from 'react';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import Text from '@/components/common/Text';
import Skeleton from '@/components/common/loader/Skeleton';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import BorderTitle from '@/components/common/BorderTitle';
import { useTrends } from '@/hooks/useTrends';
const LazyCard = lazy(() => import('@/components/common/Card'));

const TrendSection = () => {
	const { trends } = useTrends();
	const isLoading = trends.length === 0;

	return (
		<section className="np-home-trend-section-trend-section" data-track-section="home-trend">
			<div className="trend-header">
				<BorderTitle text="오늘의 트렌드"></BorderTitle>
			</div>
			{isLoading ? (
				<div className="placeholder">
					<Skeleton />
				</div>
			) : (
				<Suspense fallback={<Skeleton />}>
					<div className="trend-cards">
						{trends.map((trend: IArticleSummary) => (
							<LazyCard
								key={trend.id}
								data={{
									id: trend.id,
									url: ROUTES.article(trend.id),
									image: trend.image,
									header: trend.categoryName,
									main: {
										title: trend.title,
										// 부제목이 있으면 본문 앞부분 대신 (#42)
										description: trend.subtitle || trend.summary,
									},
									footer: (
										<>
											<Text color="subText">{trend.date}</Text>
											<Text color="subText">|&nbsp;&nbsp;조회수 {trend.views}</Text>
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
		</section>
	);
};

export default TrendSection;
