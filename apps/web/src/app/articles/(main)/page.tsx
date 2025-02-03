import { ArticleSummary as IArticleSummary, ArticleDetail as IArticleDetail } from '@/models/article.model';
import { fetchArticleList, fetchTrendList } from '@/api/article';
import { parseArticles } from '@/utils/parseArticles';

import HotSection from '@/app/articles/(main)/_components/HotSection';
import ListSection from '@/app/articles/(main)/_components/ListSection';
import styles from '@/app/articles/(main)/category.module.css';

export default async function CategoryPage() {
	let parsedTrends: IArticleSummary[] = [];
	try {
		const trends: IArticleDetail[] = await fetchTrendList();
		if (trends.length === 0) {
			throw new Error('트렌드 리스트를 불러오는데 실패했습니다.');
		}
		parsedTrends = parseArticles(trends);

		console.log(parsedTrends);
	} catch (error) {
		console.error(error);
	}

	let parsedArticles: IArticleSummary[] = [];
	try {
		const result = await fetchArticleList(10, 0);
		const articles: IArticleDetail[] = result.data;

		if (articles.length === 0) {
			throw new Error('아티클 리스트를 불러오는데 실패했습니다.');
		}
		parsedArticles = parseArticles(articles);
	} catch (error) {
		console.error(error);
	}

	return (
		<div className={styles.categoryPage}>
			<HotSection trends={parsedTrends} />
			<ListSection initialArticles={parsedArticles} />
		</div>
	);
}
