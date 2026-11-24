import { ArticleDetail as IArticleDetail } from '@/types/article';
import type { HomeToday } from '@newpick/shared';
import { fetchArticleList } from '@/api/article';
import { fetchHomeToday } from '@/api/edition';
import { isBuildPhase } from '@/constants/site';
import { cx } from '@/styles/tw';
import InOut from '@/components/common/InOut';
import StackPanel from '@/components/common/StackPanel';

import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';
import TitleSection from '@/app/(home)/_components/TitleSection';
import BreakingBand, { BreakingCard } from '@/components/common/Breaking';
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
			{/* 속보가 나가 있으면 맨 위에 늘 보이는 띠 (브라우저에서 1분마다 확인). 큰 속보 칸은 체험하기 아래 */}
			<BreakingBand />
			<TitleSection firstArticles={firstArticles} secondArticles={secondArticles} />
			{/*
			  첫 화면 패널(로고 · 배너 두 줄)은 제자리에 멈추고, 아래 칸들이 한 장의 판이 되어 위로 올라와 덮는다.
			  판의 바탕은 화면 끝까지 (배너 띠가 화면 너비라 그것까지 가리게). 덮이는 패널은 작아지고 흐려진다 (TitleSection)
			*/}
			<div
				className={cx(
					'np-home-cover relative z-1 isolate pt-10',
					'before:absolute before:inset-y-0 before:left-1/2 before:-z-1 before:w-screen before:-translate-x-1/2 before:bg-background',
				)}
			>
				{/*
				  구독 칸 위의 칸들은 한 장의 판: 아래 끝까지 본 뒤 멈추고, 구독 칸이 아래에서 올라와 덮는 동안 작아지고 흐려진다 (첫 화면 패널과 같은 동작)
				*/}
				<StackPanel>
					<HeroSection />
					{/* 속보가 나가 있으면 체험하기 바로 아래에 사진을 쓴 큰 칸 */}
					<BreakingCard />
					<hr />
					{/*
					  순서: 체험(CTA) → 한눈에(핵심 3줄) → 나를 위한 소식(로그인) → 본편(오늘의 뉴스레터) → 맥락(이어지는 소식 · 분야를 넘는 흐름) → 발견(최신 트렌드 · 지금 뜨는 소식) → 구독.
					  - 나를 위한 소식은 비어 있는 날이 많아(후속은 매일 생기지 않는다) 모두가 보는 핵심 3줄 아래에 둔다
					  - 이어지는 소식는 방금 본 오늘 소식이 며칠 전 어디서 시작됐는지라 뉴스레터 바로 다음, 편집 해설인 흐름은 그 뒤
					  - 최신 트렌드는 뜨는 태그로 묶은 칸이라 같은 데이터를 쓰는 '지금 뜨는 소식' 바로 위. 편집본이 없으면 '오늘' 칸은 빠진다
					*/}
					{/* 칸마다 스크롤 등장 · 퇴장 (InOut: 칸마다 모양이 다르다) */}
					{today && (
						<InOut kind="lines">
							<KeyLinesSection date={today.date} stories={today.topLines} />
						</InOut>
					)}
					{/* 로그인했을 때만: 지켜보는 소식 · 팔로우한 태그의 새 소식 */}
					<InOut kind="personal">
						<PersonalSection />
					</InOut>
					<InOut kind="trend">
						<TrendSection />
					</InOut>
					{today && (
						<>
							{/* 날짜를 넘어 이어지는 사건 → 같은 날 분야를 넘는 흐름 */}
							<InOut kind="continuing">
								<ContinuingSection stories={today.continuing ?? []} />
							</InOut>
							<InOut kind="threads">
								<ThreadsSection threads={today.threads} />
							</InOut>
							<InOut kind="topics">
								<TopicTrendSection topics={today.topics} />
							</InOut>
							<InOut kind="popular">
								<PopularSection
									risingTags={today.risingTags}
									mostRead={today.mostRead}
									mostScrapped={today.mostScrapped}
								/>
							</InOut>
						</>
					)}
				</StackPanel>
				{/*
				  구독 칸: 바탕을 화면 끝까지 깔고 위에 놓여, 올라오며 위 판을 덮는다.
				  위 판은 마지막 칸(지금 뜨는 소식)이 화면 위쪽까지 올라온 뒤 멈추고(useStackPanel 'bottom'), 위쪽 여백(30svh)만큼 더 스크롤하면 덮인다.
				  예전에는 판 아래 끝이 화면 아래에 닿자마자 멈춰, 지금 뜨는 소식이 화면 아래에 걸린 채 덮였다 (여백은 판 뒤라 보이지 않는다).
				  높이는 '화면 − footer'로, 맨 아래까지 내리면 구독 칸과 footer가 화면을 꼭 채운다 (footer 높이는 MainLayout이 알린다).
				  위에 붙는 속보 띠만큼 위 여백을 두고, 파란 띠는 그 바로 아래 맨 위에 붙는다 (남는 공간은 카드 아래).
				  머리글 높이는 넣지 않는다: 맨 아래에서 머리글이 열리고 닫힐 때마다 여백 → 페이지 길이 → 스크롤 자리가 바뀌어,
				  머리글이 그걸 위로 스크롤한 것으로 보고 다시 열리기를 끝없이 되풀이했다 (e2e 빠른 구독이 '움직이는 단추'로 실패).
				  맨 아래까지 내려오면 머리글은 숨어 있어 파란 띠가 속보 띠 바로 아래에 붙고, 조금 올려 머리글이 열리면 띠 위쪽을 잠깐 가린다
				*/}
				<div className="relative z-1 isolate mt-[30svh] flex min-h-[calc(100svh-var(--np-footer-height,0px))] flex-col pt-[var(--np-breaking-band,0px)] before:absolute before:inset-y-0 before:left-1/2 before:-z-1 before:w-screen before:-translate-x-1/2 before:bg-background">
					<InOut kind="subscribe">
						<SubscribeSection />
					</InOut>
				</div>
			</div>
		</div>
	);
}
