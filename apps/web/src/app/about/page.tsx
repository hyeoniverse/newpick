import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { fetchArticleList } from '@/api/article';

import styles from '@/app/about/about.module.css';
import TitleSection from '@/app/about/_components/TitleSection';
import WhyNewpickSection from '@/app/about/_components/WhyNewpickSection';
import CoreFeature from '@/app/about/_components/CoreFeature';
import ExploreSection from '@/app/about/_components/ExploreSection';
import WhoSection from '@/app/about/_components/WhoSection';
import HowToUseSection from '@/app/about/_components/HowToUseSection';
import Logos from '@/app/about/_components/Logos';

async function AboutPage() {
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
		<div className={styles.about}>
			<TitleSection
				firstArticles={firstArticles}
				secondArticles={secondArticles}
			/>
			<WhyNewpickSection />
			<CoreFeature />
			<HowToUseSection />
			<Logos />
			<ExploreSection />
			<WhoSection />
		</div>
	);
}

export default AboutPage;
