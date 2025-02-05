import API_ENDPOINTS from '@/constants/api';
import { notFound } from 'next/navigation';

export const fetchArticleList = async (limit: number = 5, offset: number = 0) => {
	const response = await fetch(API_ENDPOINTS.NEWSLETTER.LIST(limit, offset));

	if (!response.ok) {
		throw new Error('아티클 리스트를 불러오는데 실패했습니다.');
	}

	return await response.json();
};

export const fetchArticle = async (slug: string) => {
	const response = await fetch(`${API_ENDPOINTS.NEWSLETTER.BASE}/${slug}`);

	if (response.status === 404) {
		notFound();
	}

	if (!response.ok) {
		throw new Error('아티클을 불러오는데 실패했습니다.');
	}
	const article = await response.json();

	return article.data;
};

export const fetchPopularArticle = async (limit: number = 5, offset: number = 0, popular: boolean) => {
	const response = await fetch(API_ENDPOINTS.NEWSLETTER.POPULAR(limit, offset, popular));

	if (!response.ok) {
		throw new Error('아티클 리스트를 불러오는데 실패했습니다.');
	}

	return await response.json();
};

export const fetchTrendList = async (categoryId?: number) => {
	const response = await fetch(API_ENDPOINTS.NEWSLETTER.TRENDS(categoryId));

	if (!response.ok) {
		throw new Error('트렌드 리스트를 불러오는데 실패했습니다.');
	}

	const trends = await response.json();
	return trends.data;
};

export const fetchArticleByCategory = async (category: number, limit: number = 5, offset: number = 0) => {
	const response = await fetch(API_ENDPOINTS.NEWSLETTER.CATEGORY(category, limit, offset));

	if (!response.ok) {
		throw new Error('아티클 리스트를 불러오는데 실패했습니다.');
	}

	return await response.json();
};

export const fetchRelatedNews = async (link: string) => {
	const response = await fetch(API_ENDPOINTS.NEWS.RELATED(link), {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error('관련 뉴스를 불러오는데 실패했습니다.');
	}

	const news = await response.json();
	return news.data;
};

export const fetchDateNewsletter = async (limit: number = 5, offset: number = 0, startDate?: string, endDate?: string) => {
	const response = await fetch(API_ENDPOINTS.NEWSLETTER.DATE(limit, offset, startDate, endDate));

	if (!response.ok) {
		throw new Error('날짜별 뉴스레터를 불러오는데 실패했습니다.');
	}

	return await response.json();
};