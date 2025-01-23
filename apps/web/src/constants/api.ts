export const API_URL = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:3001';

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: `${API_URL}/auth/google`,
		LOGOUT: `${API_URL}/auth/logout`,
		CALLBACK: `${API_URL}/auth/google/callback`,
		USER: `${API_URL}/auth/user`,
	},
	SUBSCRIBERS: {
		START: `${API_URL}/subscribers/start`,
		END: `${API_URL}/subscribers/end`,
	},
	NEWS: {
		CRAWL: `${API_URL}/news/crawl`,
		GET_BY_CATEGORY: (category: string, page: number, limit: number) =>
			`${API_URL}/news?category=${category}&page=${page}&limit=${limit}`,
		GET_BY_ID: (id: string) => `${API_URL}/news/${id}`,
	},
	NEWSLETTER: {
		BASE: `${API_URL}/newsletter`,
		PAGINATED: (page: number, limit: number) => `${API_URL}/newsletter?page=${page}&limit=${limit}`,
	},
	MAIL: {
		SEND: `${API_URL}/mail/send`,
	},
	AI_SUMMARY: {
		GET_NEWS: `${API_URL}/ai-summary/get-news`,
		SUMMARIZE: `${API_URL}/ai-summary/summarize`,
	},
	AI_LOG: {
		BASE: `${API_URL}/ai/log`,
		PAGINATED: (newsId: number, page: number, limit: number) =>
			`${API_URL}/ai/log?newsId=${newsId}&page=${page}&limit=${limit}`,
	},
	FEEDBACK: {
		BASE: `${API_URL}/feedback`,
		PAGINATED: (newsletterId: number, page: number, limit: number) =>
			`${API_URL}/feedback?newsletterId=${newsletterId}&page=${page}&limit=${limit}`,
	},
};

export default API_ENDPOINTS;
