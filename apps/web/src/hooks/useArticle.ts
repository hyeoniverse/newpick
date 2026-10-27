import { ApiError } from '@/api/client';
import { NewsInfo as INewsInfo } from '@/models/article.model';
import {
	fetchArticle,
	fetchArticleByCategory,
	fetchArticleList,
	fetchPopularArticle,
	fetchRelatedNews,
	fetchTrendList,
} from '@/api/article';
import { ArticleInfo as IArticleInfo, ArticleDetail as IArticleDetail } from '@/models/article.model';
import { useQuery } from '@tanstack/react-query';

/**
 * 특정 기사(slug) 내용을 가져오는 함수
 */
export const getArticleContent = async (slug: string): Promise<IArticleInfo> => {
	return await fetchArticle(slug);
};
export function useArticleContentQuery(slug: string, initialData?: IArticleInfo) {
	return useQuery<IArticleInfo, Error>({
		queryKey: ['articleContent', slug],
		queryFn: () => getArticleContent(slug),
		initialData,
	});
}

/**
 * 인기 기사 목록을 가져오는 함수 (조회수 기준 정렬)
 */
export const getPopularArticles = async (
	limit: number = 5,
	offset: number = 0,
	trend: boolean = true,
): Promise<IArticleDetail[]> => {
	const { data }: { data: IArticleDetail[] } = await fetchPopularArticle(limit, offset, trend);
	return data;
};
export function usePopularArticlesQuery(limit: number = 5, offset: number = 0, trend: boolean = true) {
	return useQuery<IArticleDetail[], Error>({
		queryKey: ['popularArticles', limit, offset, trend],
		queryFn: () => getPopularArticles(limit, offset, trend),
	});
}

/**
 * 최신 기사 목록을 가져오는 함수
 */
export const getArticleList = async (limit: number = 5, offset: number = 0): Promise<IArticleDetail[]> => {
	const { data }: { data: IArticleDetail[] } = await fetchArticleList(limit, offset);
	return data;
};
export function useArticleListQuery(limit: number = 5, offset: number = 0) {
	return useQuery<IArticleDetail[], Error>({
		queryKey: ['articleList', limit, offset],
		queryFn: () => getArticleList(limit, offset),
	});
}

/**
 * 트렌드 목록을 가져오는 함수
 */
export const getTrendList = async (categoryId?: number): Promise<IArticleDetail[]> => fetchTrendList(categoryId);

/**
 * 특정 카테고리의 기사 목록을 가져오는 함수
 */
export const getCategoryList = async (
	category: number,
	limit: number = 10,
	offset: number = 0,
): Promise<IArticleDetail[]> => {
	const { data }: { data: IArticleDetail[] } = await fetchArticleByCategory(category, limit, offset);
	return data;
};

/**
 * 뉴스레터에 쓴 원문 기사들. 크롤링 원문은 30일 뒤 지워지므로(TTL) 일부가 없을 수 있어, 찾은 것만 돌려줍니다.
 * (이전에는 Promise.all이라 하나만 404여도 모두 사라지고, 처리되지 않은 오류가 페이지에 남았습니다)
 */
export const getRelatedNews = async (links: string[]): Promise<INewsInfo[]> => {
	const results = await Promise.allSettled(links.map((link) => fetchRelatedNews(link)));
	// 하나도 못 받았는데 그 이유가 '없음(404)'이 아니면(요청 제한 · 서버 오류 등) 빈 목록을 캐시하지 않게
	// 실패로 돌려 React Query가 다시 시도한다. 모두 404면 정말 없는 것이라 빈 목록
	const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
	const retryable = failures.find((failure) => !(failure.reason instanceof ApiError && failure.reason.status === 404));
	if (links.length > 0 && failures.length === results.length && retryable) throw retryable.reason;
	return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
};
