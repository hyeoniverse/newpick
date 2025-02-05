import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { fetchDateNewsletter } from '@/api/article';
import { dateFormatter } from '@/utils/formatter';

export const getTodayArticles = async (limit: number) => {
	const now = new Date();

	// 기준시간 오전 8시 설정
	const threshold = new Date();
	threshold.setHours(8, 0, 0, 0);

	if (now < threshold) {
		threshold.setDate(threshold.getDate() - 1);
	}

	const formattedStartDate = dateFormatter(threshold.toString());
	const formattedEndDate = formattedStartDate;

	const data = await fetchDateNewsletter(limit, 0, formattedStartDate, formattedEndDate);
	console.log(data);
	const newsletters: IArticleDetail[] = data.data;

	const TodayNewsletter = newsletters.filter((n) => new Date(n.createdAt) >= threshold);
	return TodayNewsletter;
};

export const userSubscribeArticles = async (categoryIds: number[]) => {
	const todayNewsletter: IArticleDetail[] = await getTodayArticles(20);
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
};
