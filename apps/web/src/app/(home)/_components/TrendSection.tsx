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
import { CATEGORIES } from '@/constants/categories';
import { kstDate, monthDay } from '@/utils/formatter';
import { PCLogo } from '@/components/common/icons/LogoSVG';
const LazyCard = lazy(() => import('@/components/common/Card'));

/**
 * 오늘 뉴스레터가 아직 없는 분야 자리 (만들기 실패 · 재시도 중 · 아침 발행 전).
 * 사진 기본 그림(회색 바탕 + 회색 NewPick, public/img/newpick_default_img.jpg)을 본떠, 로고 아래에 '아직 준비 중이에요'.
 * 그림 파일 대신 그려서 글자가 또렷하고 다크 테마를 따른다
 */
function PendingCard({ category }: { category: string }) {
	return (
		// 카드(Card)와 같은 간격: 사진 아래 16px에 분야
		<div className="flex flex-col gap-4">
			<div className="np-ratio-wide flex w-full flex-col items-center justify-center gap-3 rounded-[8px] bg-neutral">
				<PCLogo className="h-6 text-light-grey" aria-hidden />
				<span className="text-small text-light-grey">{HOME.today.pending}</span>
			</div>
			<span className="text-small font-semi-bold text-primary">{category}</span>
		</div>
	);
}

/** 분야 차례 ('전체' 빼고) */
const FIELDS = CATEGORIES.filter((c) => c.id !== 0).map((c) => c.name);

/**
 * 오늘의 뉴스레터: 분야마다 오늘(한국 날짜) 발행된 한 편. 아직 없는 분야는 '아직 준비 중이에요' 자리로 둬서 늘 분야 수만큼 보인다.
 * API(GET /newsletters/trends)는 분야마다 최근 7일 안 가장 최근 것을 주고, 오늘 것만 여기서 고른다
 */
const TrendSection = () => {
	const { trends, isLoading } = useTrends();
	const today = kstDate();
	const byField = new Map(trends.filter((t) => t.date === today).map((t) => [t.categoryName, t]));

	return (
		<section className="np-home-trend-section-trend-section" data-track-section="home-trend">
			<div className="trend-header">
				<BorderTitle text={HOME.today.newsletters} className="mb-0 flex-1"></BorderTitle>
				{/* 오늘이 며칠인지 (예: 11월 24일) */}
				<span className="ml-3 shrink-0 text-small text-sub-text">{monthDay(today)}</span>
			</div>
			{isLoading ? (
				<div className="placeholder">
					<Skeleton />
				</div>
			) : (
				<Suspense fallback={<Skeleton />}>
					<div className="trend-cards">
						{FIELDS.map((field) => {
							const trend: IArticleSummary | undefined = byField.get(field);
							if (!trend) return <PendingCard key={field} category={field} />;
							return (
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
							);
						})}
					</div>
				</Suspense>
			)}
		</section>
	);
};

export default TrendSection;
