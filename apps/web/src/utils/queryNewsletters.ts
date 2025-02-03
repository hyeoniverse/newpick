import { ArticleSummary as IArticleSummary } from '@/models/article.model';

export const filterByCategories = (newsletters: IArticleSummary[], categories: string[]): IArticleSummary[] => {
	// '전체' 카테고리일 경우 모든 뉴스레터 반환
	if (categories.includes('전체')) return newsletters;

	// 선택된 카테고리가 없으면 빈 배열 반환
	if (categories.length === 0) return [];

	return newsletters.filter((newsletter) => categories.includes(newsletter.categoryName));
};

export const filterTopTrends = (trends: IArticleSummary[], maxResults: number = 4): IArticleSummary[] => {
	const today = new Date();
	const oneWeekAgo = new Date(today);
	oneWeekAgo.setDate(today.getDate() - 7);

	return trends
		.filter((trend) => {
			const trendDate = new Date(trend.date);
			return trendDate >= oneWeekAgo && trendDate <= today;
		})
		.sort((a, b) => (b.bookmarks || 0) - (a.bookmarks || 0))
		.slice(0, maxResults);
};

export const filterTodayTrends = (trends: IArticleSummary[]): IArticleSummary[] => {
	const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
	today.setHours(0, 0, 0, 0); // 오늘 시작 시간 설정

	return trends.filter((trend) => {
		const trendDate = new Date(trend.date);
		trendDate.setHours(0, 0, 0, 0); // 트렌드 날짜 시간 제거
		return trendDate.getTime() === today.getTime(); // 날짜가 오늘인지 확인
	});
};

export const sortNewsletters = (
	newsletters: IArticleSummary[],
	sortBy: 'latest' | 'bookmarks' | 'views'
): IArticleSummary[] => {
	return [...newsletters].sort((a, b) => {
		if (sortBy === 'latest') {
			// 최신순 정렬 (날짜 기준)
			return new Date(b.date).getTime() - new Date(a.date).getTime();
		} else if (sortBy === 'bookmarks') {
			// 좋아요 순 정렬 (bookmarks 값이 없을 수도 있으므로 기본값 0 처리)
			return (b.bookmarks || 0) - (a.bookmarks || 0);
		} else if (sortBy === 'views') {
			// 조회수 순 정렬 (views 값이 없을 수도 있으므로 기본값 0 처리)
			return (b.views || 0) - (a.views || 0);
		}
		return 0;
	});
};
