import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { fetchArticleList } from '@/api/article';

import styles from '@/app/about/about.module.css';
import TitleSection from '@/app/about/_components/TitleSection';
import WhyNewpickSection from '@/app/about/_components/WhyNewpickSection';
import CoreFeature from '@/app/about/_components/CoreFeature';
import ExploreSection from '@/app/about/_components/ExploreSection';
import WhoSection from '@/app/about/_components/WhoSection';

async function AboutPage() {
	let fetchedArticles: IArticleDetail[] = [];
	try {
		const { data } = await fetchArticleList(20);
		fetchedArticles = data;
	} catch (error) {
		console.error('❌ 뉴스레터 리스트 불러오기 실패:', error);
	}

	return (
		<div className={styles.about}>
			<TitleSection articles={fetchedArticles} />
			<WhyNewpickSection />
			<CoreFeature />
			<ExploreSection />
			<WhoSection />
		</div>
	);
}

export default AboutPage;
