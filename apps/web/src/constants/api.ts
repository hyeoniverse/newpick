/** 백엔드 주소. 서버(SSR, middleware, next.config rewrites)에서만 사용합니다. */
export const BACK_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * 브라우저는 /api(Next rewrites 프록시)를 거쳐 백엔드에 요청합니다.
 * 같은 도메인으로 요청하므로 인증 쿠키가 프론트 도메인에 저장되고, 별도 CORS·쿠키 도메인 설정이 필요 없습니다.
 */
export const API_URL = typeof window === 'undefined' ? BACK_URL : '/api';
export const PROTECTED = ['/mypage']; // 로그인이 필요한 경로 (middleware에서 확인)
/** 로그인 여부만 알려 주는 표시 쿠키 (토큰 아님, api가 발급). 정적 페이지에서 첫 화면의 로그인 상태를 정할 때 씁니다. */
export const SESSION_HINT_COOKIE = 'logged_in';

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: () => `${API_URL}/auth/google`,
		LOGOUT: () => `${API_URL}/auth/logout`,
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
	/** 서비스 문의처 (구독 메일 발송 주소) */
	CONTACT: () => `${API_URL}/contact`,
	NEWSLETTER: {
		BASE: `${API_URL}/newsletters`,
		VIEW_COUNT: (newsletterId: number) => `${API_URL}/newsletters/viewcount/${newsletterId}`,
		LIST: (limit: number, offset: number, popular?: boolean) =>
			popular
				? `${API_URL}/newsletters?limit=${limit}&offset=${offset}&popular=${popular}`
				: `${API_URL}/newsletters?limit=${limit}&offset=${offset}`,
		CATEGORY: (category: number, limit: number, offset: number) =>
			`${API_URL}/newsletters/category/${category}?limit=${limit}&offset=${offset}`,
		TRENDS: (category?: number) => `${API_URL}/newsletters/trends` + (category ? `?categoryId=${category}` : ''),
		POPULAR: (limit: number, offset: number, trend: boolean) =>
			`${API_URL}/newsletters?limit=${limit}&offset=${offset}&trend=${trend}`,
		DATE: (limit: number, offset: number, startDate?: string, endDate?: string) =>
			`${API_URL}/newsletters?limit=${limit}&offset=${offset}&startDate=${startDate}&endDate=${endDate}`,
	},
	FEEDBACK: {
		BOOKMARK: `${API_URL}/feedback/bookmark`,
	},
	NEWS: {
		RELATED: (link: string) => `${API_URL}/crawling/link?link=${link}`,
	},
};

export default API_ENDPOINTS;
