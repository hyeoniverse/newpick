import { ArticleDetail as IArticleDetail } from '@/types/article';
import type { HomeToday } from '@newpick/shared';
import { fetchArticleList } from '@/api/article';
import { fetchHomeToday } from '@/api/edition';
import { isBuildPhase } from '@/constants/site';

import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';
import TitleSection from '@/app/(home)/_components/TitleSection';
import PersonalSection from '@/app/(home)/_components/PersonalSection';
import {
	ContinuingSection,
	KeyLinesSection,
	PopularSection,
	ThreadsSection,
	TopicTrendSection,
} from '@/app/(home)/_components/TodaySections';

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
			{/*
			  순서: 체험(CTA) → 한눈에(핵심 3줄) → 나를 위한 소식(로그인) → 본편(오늘의 뉴스레터) → 맥락(이어지는 이야기 · 분야를 넘는 흐름) → 발견(최신 트렌드 · 지금 뜨는 소식) → 구독.
			  - 나를 위한 소식은 비어 있는 날이 많아(후속은 매일 생기지 않는다) 모두가 보는 핵심 3줄 아래에 둔다
			  - 이어지는 이야기는 방금 본 오늘 소식이 며칠 전 어디서 시작됐는지라 뉴스레터 바로 다음, 편집 해설인 흐름은 그 뒤
			  - 최신 트렌드는 뜨는 태그로 묶은 칸이라 같은 데이터를 쓰는 '지금 뜨는 소식' 바로 위. 편집본이 없으면 '오늘' 칸은 빠진다
			*/}
			{today && <KeyLinesSection date={today.date} stories={today.topLines} />}
			{/* 로그인했을 때만: 지켜보는 소식 · 팔로우한 태그의 새 소식 */}
			<PersonalSection />
			<TrendSection />
			{today && (
				<>
					{/* 날짜를 넘어 이어지는 사건 → 같은 날 분야를 넘는 흐름 */}
					<ContinuingSection stories={today.continuing ?? []} />
					<ThreadsSection threads={today.threads} />
					<TopicTrendSection topics={today.topics} />
					<PopularSection risingTags={today.risingTags} mostRead={today.mostRead} mostScrapped={today.mostScrapped} />
				</>
			)}
			<SubscribeSection />
		</div>
	);
}
