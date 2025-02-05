import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { fetchArticleList } from '@/api/article';

export const getTodayArticles = async (limit: number) => {
	const data = await fetchArticleList(limit, 0);
	const newsletters: IArticleDetail[] = data.data;

  const now = new Date();

  const threshold = new Date();
  threshold.setHours(8, 0, 0, 0);
  if (now < threshold) {
    // 만약 지금이 8시 이전이라면 어제 8시로 설정
    threshold.setDate(threshold.getDate() - 1);
  }

  const TodayNewsletter = newsletters.filter((n) => new Date(n.createdAt) >= threshold);
  return TodayNewsletter;
};

export const userSubscribeArticles = async (categoryIds: number[]) => {
  const todayNewsletter: IArticleDetail[] = await getTodayArticles(1000);
  const userArticle = todayNewsletter.filter((n) => categoryIds.includes(n.categoryId));

  const latestArticlesByCategory = categoryIds
  .map((catId) => {
    const articlesForCat = userArticle.filter((article) => article.categoryId === catId);
    if (articlesForCat.length === 0) return null;
    return articlesForCat.reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );
  })
  .filter((article): article is IArticleDetail => article !== null)
  .sort((a, b) => a.categoryId - b.categoryId);

  return latestArticlesByCategory;
}
