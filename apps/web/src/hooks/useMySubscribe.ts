import { IArticleDetail } from '@/models/article.model';
import { fetchArticleList } from '@/api/article';
import { dateFormatter } from '@/utils/formatter';


export const getTodayArticles = async (limit: number = 100) => {
  const data = await fetchArticleList(limit, 0);
  const newsletters: IArticleDetail[] = data.data;

  const now = new Date();
  const yesterday = new Date(now.setDate(now.getDate() - 1));

  const TodayNewsletter = newsletters.filter((n) => dateFormatter(n.createdAt) === dateFormatter(yesterday.toString()));

  return TodayNewsletter;
};

export const userSubscribeArticles = async (categoryId: number[]) => {
  const todayNewsletter: IArticleDetail[] = await getTodayArticles(100);
  const userArticle = todayNewsletter.filter((n) => categoryId.includes(n.categoryId));

  return userArticle;
}
