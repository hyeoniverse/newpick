export const BACK_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'; // 백엔드 서버
export const FRONT_URL = process.env.NEXT_PUBLIC_FRONT_URL || 'http://localhost:3000'; // 프론트 서버

// API 요청이 SSR(서버)인지 CSR(클라이언트)인지 판단하여 적절한 API URL 반환
export const getApiUrl = () => (typeof window === 'undefined' ? BACK_URL : '/api');
// export const API_URL = getApiUrl();
export const API_URL = BACK_URL;
export const PROTECTED = ['/mypage', '/subscribers', '/feedback']; // 로그인이 필요한 경로

export const TOKEN = {
	ACCESS: 'access_token',
	USER_ID: 'user_id',
};

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: () => `${API_URL}/auth/google`,
		LOGOUT: () => `${API_URL}/auth/logout`,
		CALLBACK: () => `${API_URL}/auth/google/callback`,
		REFRESH: () => `${API_URL}/auth/refresh`,
	},
	MY: {
		PROFILE: () => `${API_URL}/mypage/profile`,
		BOOKMARKS: () => `${API_URL}/mypage/bookmarks`,
	},
	SUBSCRIBERS: {
		STATUS: () => `${API_URL}/subscribers/status`,
		HISTORY: () => `${API_URL}/subscribers/history`,
		INTERESTS: () => `${API_URL}/mypage/interests`,
		START: () => `${API_URL}/subscribers/start`,
		PAUSE: () => `${API_URL}/subscribers/pause`,
		CANCEL: () => `${API_URL}/subscribers/cancel`,
	},
	NEWSLETTER: {
		BASE: `${API_URL}/newsletters`,
		VIEW_COUNT: (newsletterId: number) => `${API_URL}/newsletters/viewcount/${newsletterId}`,
		PAGINATED: (page: number, limit: number) => `${API_URL}/newsletters?page=${page}&limit=${limit}`,
		LIST: (limit: number, offset: number, popular?: boolean) =>
			popular
				? `${API_URL}/newsletters?limit=${limit}&offset=${offset}&popular=${popular}`
				: `${API_URL}/newsletters?limit=${limit}&offset=${offset}`,
		CATEGORY: (category: number, limit: number, offset: number) =>
			`${API_URL}/newsletters/category/${category}?limit=${limit}&offset=${offset}`,
		TRENDS: (category?: number) => `${API_URL}/newsletters/trends` + (category ? `?categoryId=${category}` : ''),
		POPULAR: (limit: number, offset: number, popular: boolean) =>
			`${API_URL}/newsletters?limit=${limit}&offset=${offset}&popular=${popular}`,
		SUMMARIZE: () => `${API_URL}/ai-summary/summarize`,
	},
	FEEDBACK: {
		BASE: () => `${API_URL}/feedback`,
		PAGINATED: (newsletterId: number, page: number, limit: number) =>
			`${API_URL}/feedback?newsletterId=${newsletterId}&page=${page}&limit=${limit}`,
		BOOKMARK: `${API_URL}/feedback/bookmark`,
	},
	NEWS: {
		CRAWL: () => `${API_URL}/news/crawl`,
		GET_BY_CATEGORY: (category: string, page: number, limit: number) =>
			`${API_URL}/news?category=${category}&page=${page}&limit=${limit}`,
		GET_BY_ID: (id: string) => `${API_URL}/news/${id}`,
	},
	CATEGORY: {
		BASE: `${API_URL}/category`,
		GET_BY_ID: (id: string) => `${API_URL}/category/${id}`,
	},
};

export default API_ENDPOINTS;
