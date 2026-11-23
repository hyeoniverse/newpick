import { ArticleDetail as IArticleDetail } from '@/types/article';
import type { HomeToday } from '@newpick/shared';
import { fetchArticleList } from '@/api/article';
import { fetchHomeToday } from '@/api/edition';
import { isBuildPhase } from '@/constants/site';

import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';
import TitleSection from '@/app/(home)/_components/TitleSection';
import { PopularSection, TodayTop } from '@/app/(home)/_components/TodaySections';

/** 뉴스레터는 하루 한 번 만들어지므로 10분마다 다시 만듭니다. */
export const revalidate = 600;

export default async function HomePage() {
	let fetchedArticles: IArticleDetail[] = [];
	let today: HomeToday | null = null;
	try {
		const [list, home] = await Promise.all([fetchArticleList(40), fetchHomeToday()]);
		fetchedArticles = list.data;
		today = home;
	} catch (error) {
		// 운영 중 다시 만들 때 실패하면 던져서 Next가 이전에 만든 화면을 계속 쓰게 한다 (#340: 예전에는 빈 사진 띠를
		// 10분 동안 저장했다). 빌드 중에는 api가 없을 수 있어 빈 목록으로 만든다
		if (!isBuildPhase()) throw error;
		console.error('❌ 홈 데이터 불러오기 실패:', error);
	}
	const firstArticles = fetchedArticles.slice(0, 20);
	const secondArticles = fetchedArticles.slice(20, 40);

	return (
		<div className="np-home-page">
			<TitleSection firstArticles={firstArticles} secondArticles={secondArticles} />
			<HeroSection />
			<hr />
			{/* 오늘의 3줄 · 오늘의 트렌드 · 분야를 넘는 흐름 (편집본이 없으면 빠진다) */}
			<TodayTop today={today} />
			<TrendSection />
			{today && (
				<PopularSection risingTags={today.risingTags} mostRead={today.mostRead} mostScrapped={today.mostScrapped} />
			)}
			<SubscribeSection />
		</div>
	);
}
