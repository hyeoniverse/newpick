import { fetchArticle, fetchArticleList } from '@/lib/articleApi';
import { IArticleDetail } from '@/models/articleDetail';

export const getArticleContent = async (slug: string) => {
  const data = await fetchArticle(slug);

  const article: IArticleDetail = data.data;

  return article;
}

export const getPopularArticles = async (limit: number = 5) => {
  const data = await fetchArticleList(limit, 0);
  const newsletters = data.data;

  newsletters.sort((a: any, b: any) => b.viewcount - a.viewcount);

  return newsletters.slice(0, 5);
};

export const getArticleList = async (limit: number = 5) => {
  const data = await fetchArticleList(limit, 0);

  return data.data;
}
