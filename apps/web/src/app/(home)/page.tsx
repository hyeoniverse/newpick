import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { fetchArticleList } from '@/api/article';

import styles from '@/app/(home)/home.module.css';
import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';
import TitleSection from '@/app/(home)/_components/TitleSection';

export default async function HomePage() {
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
			<TrendSection />
			<SubscribeSection />
		</div>
	);
}
