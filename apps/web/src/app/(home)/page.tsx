import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';
import { fetchArticleList, fetchTrendList } from '@/api/article';

import styles from '@/app/(home)/home.module.css';
import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';
import { parseArticles } from '@/utils/parseArticles';
import TitleSection from '@/app/(home)/_components/TitleSection';

export default async function HomePage() {
	let parsedTrends: IArticleSummary[] = [];
	try {
		const trends: IArticleDetail[] = await fetchTrendList();
		parsedTrends = parseArticles(trends);
	} catch (error) {
		console.error(error);
	}

	let fetchedArticles: IArticleDetail[] = [];
	try {
		const { data } = await fetchArticleList(40);
		fetchedArticles = data;
	} catch (error) {
		console.error('❌ 뉴스레터 리스트 불러오기 실패:', error);
	}
	const firstArticles = fetchedArticles.slice(0, 20);
	const secondArticles = fetchedArticles.slice(20, 40);

	return (
		<div className={styles.homePage}>
			<TitleSection firstArticles={firstArticles} secondArticles={secondArticles} />
			<HeroSection />
			<hr />
			<TrendSection trends={parsedTrends} />
			<SubscribeSection trends={parsedTrends} />
		</div>
	);
}
