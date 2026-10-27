import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';
import { parseArticles } from '@/utils/parseArticles';
import { mapIdToTitle } from '@/utils/mapInterests';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { fetchArticleByCategory, fetchTrendList } from '@/api/article';
import { CATEGORIES } from '@/constants/categories';
import { pageMetadata } from '@/constants/site';

import styles from '@/app/articles/(main)/category.module.css';
import HotSection, { CategoryStats } from '@/app/articles/(main)/_components/HotSection';
import ListSection from '@/app/articles/(main)/_components/ListSection';
import ArticlesLoading from '@/app/articles/(main)/_components/ArticlesLoading';

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** 분야 페이지 배너의 요약: 최근 7일 편 수와 자주 나온 키워드 3개 */
function summarize(newsletters: IArticleDetail[]): CategoryStats {
	const since = Date.now() - WEEK;
	const recent = newsletters.filter((n) => new Date(n.createdAt).getTime() >= since);
	const counts = new Map<string, number>();
	for (const n of recent) for (const k of n.keywords ?? []) counts.set(k, (counts.get(k) ?? 0) + 1);
	const keywords = [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([k]) => k);
	return { weekCount: recent.length, keywords };
}

/**
 * 제목과 목록이 ?categoryId=에 따라 달라지므로 요청마다 렌더링합니다.
 * 정적으로 만들면 '전체' 화면이 먼저 보였다가 바뀝니다. (트렌드 조회는 10분간 캐시)
 */
export const dynamic = 'force-dynamic';

/** 관심사를 고르면 제목 · 설명도 그 관심사로 (#15) */
export async function generateMetadata({
	searchParams,
}: {
	searchParams: Promise<{ categoryId?: string }>;
}): Promise<Metadata> {
	const categoryId = Number((await searchParams).categoryId) || 0;
	const category = CATEGORIES.find((c) => c.id === categoryId && c.id !== 0);
	return category
		? pageMetadata(
				`${category.name} 뉴스레터`,
				`${category.name}: ${category.description}. AI가 고르고 요약한 뉴픽 뉴스레터.`,
				`/articles?categoryId=${category.id}`,
			)
		: pageMetadata('뉴스레터', '관심사별로 AI가 고르고 요약한 뉴픽 뉴스레터를 모아 봅니다.', '/articles');
}

/**
 * 관심사 칩은 같은 페이지의 ?categoryId=만 바꾸므로 loading.tsx가 다시 뜨지 않는다.
 * 관심사마다 key가 다른 Suspense로 감싸, 바꿀 때마다 새 목록을 받는 동안 자리(ArticlesLoading)를 보여 준다 (#17)
 */
export default async function CategoryPage({ searchParams }: { searchParams: Promise<{ categoryId?: string }> }) {
	const categoryId = Number((await searchParams).categoryId) || 0;

	return (
		<Suspense key={categoryId} fallback={<ArticlesLoading />}>
			<CategoryContent categoryId={categoryId} />
		</Suspense>
	);
}

async function CategoryContent({ categoryId }: { categoryId: number }) {
	let parsedTrends: IArticleSummary[] = [];
	let stats: CategoryStats | undefined;
	try {
		const [trends, category] = await Promise.all([
			fetchTrendList(),
			categoryId ? fetchArticleByCategory(categoryId, 30, 0) : Promise.resolve(null),
		]);
		parsedTrends = parseArticles(trends);
		if (category) stats = summarize(category.data ?? []);
	} catch (error) {
		console.error(error);
	}

	// 분야 페이지에서 배너에 띄운 글(그 분야 최신 발행본)은 아래 목록에서 다시 보여 주지 않는다
	const categoryName = mapIdToTitle([categoryId])[0];
	const bannerId = categoryId ? parsedTrends.find((t) => t.categoryName === categoryName)?.id : undefined;

	return (
		<div className={styles.categoryPage}>
			<HotSection trends={parsedTrends} stats={stats} />
			<ListSection excludeId={bannerId} />
		</div>
	);
}
