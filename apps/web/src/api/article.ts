import API_ENDPOINTS from '@/constants/api';
import { apiFetch } from '@/api/client';
import { ArticleDetail, ArticleInfo, NewsInfo } from '@/models/article.model';

type ArticleList = { data: ArticleDetail[] };

/** 트렌드는 자주 바뀌지 않으므로 서버에서 10분간 캐시합니다. */
const TRENDS_REVALIDATE_SECONDS = 600;

export const fetchArticleList = async (limit: number = 5, offset: number = 0) =>
	apiFetch<ArticleList>(API_ENDPOINTS.NEWSLETTER.LIST(limit, offset));

/** 브라우저에서 부른다. 없는 뉴스레터(404)는 ApiError 그대로 던져 화면이 안내하게 한다 */
export const fetchArticle = async (slug: string) => {
	const article = await apiFetch<{ data: ArticleInfo }>(`${API_ENDPOINTS.NEWSLETTER.BASE}/${slug}`);
	return article.data;
};

export const fetchPopularArticle = async (limit: number = 5, offset: number = 0, popular: boolean) =>
	apiFetch<ArticleList>(API_ENDPOINTS.NEWSLETTER.POPULAR(limit, offset, popular));

export const fetchTrendList = async (categoryId?: number) => {
	const trends = await apiFetch<ArticleList>(API_ENDPOINTS.NEWSLETTER.TRENDS(categoryId), {
		next: { revalidate: TRENDS_REVALIDATE_SECONDS },
	});
	return trends.data;
};

export const fetchArticleByCategory = async (category: number, limit: number = 5, offset: number = 0) =>
	apiFetch<ArticleList>(API_ENDPOINTS.NEWSLETTER.CATEGORY(category, limit, offset));

export const fetchRelatedNews = async (link: string) => {
	const news = await apiFetch<{ data: NewsInfo }>(API_ENDPOINTS.NEWS.RELATED(link));
	return news.data;
};

export const fetchDateNewsletter = async (
	limit: number = 5,
	offset: number = 0,
	startDate?: string,
	endDate?: string,
) => apiFetch<ArticleList>(API_ENDPOINTS.NEWSLETTER.DATE(limit, offset, startDate, endDate));
