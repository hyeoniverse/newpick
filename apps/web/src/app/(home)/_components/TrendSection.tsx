'use client';

import { ROUTES } from '@/constants/routes';
import { Suspense, lazy } from 'react';
import { ArticleSummary as IArticleSummary } from '@/types/article';
import Text from '@/components/common/Text';
import Skeleton from '@/components/common/loader/Skeleton';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import BorderTitle from '@/components/common/BorderTitle';
import { HOME } from '@/copy';
import { useTrends } from '@/hooks/useTrends';
const LazyCard = lazy(() => import('@/components/common/Card'));

const TrendSection = () => {
	const { trends } = useTrends();
	const isLoading = trends.length === 0;

	return (
		<section className="np-home-trend-section-trend-section" data-track-section="home-trend">
			<div className="trend-header">
				{/* 오늘 나온 분야별 뉴스레터 (조회 많은 순). '오늘의 트렌드'는 소식 단위 칸(TodaySections)이 맡는다 */}
				<BorderTitle text={HOME.today.newsletters}></BorderTitle>
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
								// 첫 화면 아래라 화면 가까이 올 때 사진을 받는다 (첫 화면을 그리는 동안 큰 카드 사진을 같이 받지 않게)
								deferImage
								data={{
									id: trend.id,
									url: ROUTES.article(trend.id),
									image: trend.image,
									fallbackImage: trend.fallbackImage,
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
