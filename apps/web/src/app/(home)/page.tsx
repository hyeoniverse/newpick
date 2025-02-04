import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';
import { fetchTrendList } from '@/api/article';

import styles from '@/app/(home)/home.module.css';
import Title from '@/components/common/Title';
import FullWidthPanel from '@/components/common/FullWidthPanel';
import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';
import { parseArticles } from '@/utils/parseArticles';

export default async function HomePage() {
	let parsedTrends: IArticleSummary[] = [];
	try {
		const trends: IArticleDetail[] = await fetchTrendList();
		parsedTrends = parseArticles(trends);
	} catch (error) {
		console.error(error);
	}

	return (
		<div className={styles.homePage}>
			<HeroSection />
			<hr />
			<TrendSection trends={parsedTrends} />

			<FullWidthPanel>
				<Title size="extraLarge" weight="bold" color="background">
					📩 지금 뉴스레터를 시작해보세요
				</Title>
			</FullWidthPanel>

			<SubscribeSection trends={parsedTrends} />
		</div>
	);
}
