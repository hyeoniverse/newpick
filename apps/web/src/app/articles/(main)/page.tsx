import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { parseArticles } from '@/utils/parseArticles';
import { fetchTrendList } from '@/api/article';

import styles from '@/app/articles/(main)/category.module.css';
import HotSection from '@/app/articles/(main)/_components/HotSection';
import ListSection from '@/app/articles/(main)/_components/ListSection';

export default async function CategoryPage() {
	let parsedTrends: IArticleSummary[] = [];
	try {
		const trends = await fetchTrendList();
		parsedTrends = parseArticles(trends);
	} catch (error) {
		console.error(error);
	}

	return (
		<div className={styles.categoryPage}>
			<HotSection trends={parsedTrends} />
			<ListSection />
		</div>
	);
}
