import { ROUTES } from '@/constants/routes';
import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';
import { parseArticles } from '@/utils/parseArticles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { fetchArticleByCategory, fetchTrendList } from '@/api/article';
import { CATEGORIES } from '@/constants/categories';
import { pageMetadata } from '@/constants/site';

import HotSection, { CategoryStats } from '@/app/articles/(main)/_components/HotSection';
import ListSection from '@/app/articles/(main)/_components/ListSection';
import ArticlesLoading from '@/app/articles/(main)/_components/ArticlesLoading';

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** 분야 페이지 배너의 요약: 최근 7일 편 수 */
function summarize(newsletters: IArticleDetail[]): CategoryStats {
	const since = Date.now() - WEEK;
	return { weekCount: newsletters.filter((n) => new Date(n.createdAt).getTime() >= since).length };
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
				ROUTES.articlesByCategory(category.id),
			)
		: pageMetadata('뉴스레터', '관심사별로 AI가 고르고 요약한 뉴픽 뉴스레터를 모아 봅니다.', ROUTES.articles);
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
	// 오늘(가장 최근 발행일)에 이 분야 뉴스레터가 없을 때 배너에 대신 띄울 이 분야의 가장 최근 것
	let latest: IArticleSummary | undefined;
	try {
		const [trends, category] = await Promise.all([
			fetchTrendList(),
			categoryId ? fetchArticleByCategory(categoryId, 30, 0) : Promise.resolve(null),
		]);
		parsedTrends = parseArticles(trends);
		if (category) {
			stats = summarize(category.data ?? []);
			latest = parseArticles((category.data ?? []).slice(0, 1))[0];
		}
	} catch (error) {
		console.error(error);
	}

	return (
		<div className="np-category-page">
			<HotSection trends={parsedTrends} stats={stats} latest={latest} />
			{/* 목록은 배너(TODAY)에 띄운 글도 빼지 않고 다 보여 준다 (건수와 보이는 수가 같게) */}
			<ListSection />
		</div>
	);
}
