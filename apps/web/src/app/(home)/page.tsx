import { ArticleDetail as IArticleDetail } from '@/types/article';
import { fetchArticleList } from '@/api/article';
import { isBuildPhase } from '@/constants/site';

import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';
import TitleSection from '@/app/(home)/_components/TitleSection';

/** 뉴스레터는 하루 한 번 만들어지므로 10분마다 다시 만듭니다. */
export const revalidate = 600;

export default async function HomePage() {
	let fetchedArticles: IArticleDetail[] = [];
	try {
		const { data } = await fetchArticleList(40);
		fetchedArticles = data;
	} catch (error) {
		// 운영 중 다시 만들 때 실패하면 던져서 Next가 이전에 만든 화면을 계속 쓰게 한다 (#340: 예전에는 빈 사진 띠를
		// 10분 동안 저장했다). 빌드 중에는 api가 없을 수 있어 빈 목록으로 만든다
		if (!isBuildPhase()) throw error;
		console.error('❌ 뉴스레터 리스트 불러오기 실패:', error);
	}
	const firstArticles = fetchedArticles.slice(0, 20);
	const secondArticles = fetchedArticles.slice(20, 40);

	return (
		<div className="np-home-page">
			<TitleSection firstArticles={firstArticles} secondArticles={secondArticles} />
			<HeroSection />
			<hr />
			<TrendSection />
			<SubscribeSection />
		</div>
	);
}
