export const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL as string) || 'http://localhost:3001';

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: `${BASE_URL}/auth/google`,
		LOGOUT: `${BASE_URL}/auth/logout`,
		CALLBACK: `${BASE_URL}/auth/google/callback`,
		USER: `${BASE_URL}/auth/user`,
	},
	SUBSCRIBERS: {
		START: `${BASE_URL}/subscribers/start`,
		END: `${BASE_URL}/subscribers/end`,
	},
	NEWS: {
		CRAWL: `${BASE_URL}/news/crawl`,
		GET_BY_CATEGORY: (category: string, page: number, limit: number) =>
			`${BASE_URL}/news?category=${category}&page=${page}&limit=${limit}`,
		GET_BY_ID: (id: string) => `${BASE_URL}/news/${id}`,
	},
	NEWSLETTER: {
		BASE: `${BASE_URL}/newsletter`,
		PAGINATED: (page: number, limit: number) => `${BASE_URL}/newsletter?page=${page}&limit=${limit}`,
	},
	MAIL: {
		SEND: `${BASE_URL}/mail/send`,
	},
	AI_SUMMARY: {
		GET_NEWS: `${BASE_URL}/ai-summary/get-news`,
		SUMMARIZE: `${BASE_URL}/ai-summary/summarize`,
	},
	AI_LOG: {
		BASE: `${BASE_URL}/ai/log`,
		PAGINATED: (newsId: number, page: number, limit: number) =>
			`${BASE_URL}/ai/log?newsId=${newsId}&page=${page}&limit=${limit}`,
	},
	FEEDBACK: {
		BASE: `${BASE_URL}/feedback`,
		PAGINATED: (newsletterId: number, page: number, limit: number) =>
			`${BASE_URL}/feedback?newsletterId=${newsletterId}&page=${page}&limit=${limit}`,
	},
};

export default API_ENDPOINTS;
