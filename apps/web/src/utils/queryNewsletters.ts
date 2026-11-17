import { ArticleSummary as IArticleSummary } from '@/types/article';

export const filterByCategories = (newsletters: IArticleSummary[], categories: string[]): IArticleSummary[] => {
	// '전체' 카테고리일 경우 모든 뉴스레터 반환
	if (categories.includes('전체')) return newsletters;

	// 선택된 카테고리가 없으면 빈 배열 반환
	if (categories.length === 0) return [];

	return newsletters.filter((newsletter) => categories.includes(newsletter.categoryName));
};
