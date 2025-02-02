import { fetchArticle, fetchArticleList } from '@/api/article';
import { ArticleInfo as IArticleInfo, ArticleDetail as IArticleDetail } from '@/models/article.model';

/**
 * 특정 기사(slug) 내용을 가져오는 함수
 */
export const getArticleContent = async (slug: string): Promise<IArticleInfo> => {
	return await fetchArticle(slug);
};

/**
 * 인기 기사 목록을 가져오는 함수 (조회수 기준 정렬)
 */
export const getPopularArticles = async (limit: number = 5): Promise<IArticleDetail[]> => {
	const { data }: { data: IArticleDetail[] } = await fetchArticleList(limit, 0);

	return data
		.sort((a, b) => b.viewcount - a.viewcount) // 조회수 기준 정렬
		.slice(0, limit);
};

/**
 * 최신 기사 목록을 가져오는 함수
 */
export const getArticleList = async (limit: number = 5): Promise<IArticleDetail[]> => {
	const { data }: { data: IArticleDetail[] } = await fetchArticleList(limit, 0);
	return data;
};
