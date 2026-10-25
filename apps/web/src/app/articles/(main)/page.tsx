import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { parseArticles } from '@/utils/parseArticles';
import { fetchTrendList } from '@/api/article';

import styles from '@/app/articles/(main)/category.module.css';
import HotSection from '@/app/articles/(main)/_components/HotSection';
import ListSection from '@/app/articles/(main)/_components/ListSection';

/**
 * 제목과 목록이 ?categoryId=에 따라 달라지므로 요청마다 렌더링합니다.
 * 정적으로 만들면 '전체' 화면이 먼저 보였다가 바뀝니다. (트렌드 조회는 10분간 캐시)
 */
export const dynamic = 'force-dynamic';

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
