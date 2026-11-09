/**
 * 화면 경로를 한 곳에서 만든다. 링크 · router.push · 메타데이터 주소는 문자열을 직접 적지 않고 여기 값을 쓴다.
 * (api 주소는 constants/api.ts)
 */

/** 마이페이지 탭 (?tab=) */
export type MypageTab = 'subscriptions' | 'bookmarks' | 'highlights' | 'follows' | 'settings';

export const ROUTES = {
	home: '/',
	about: '/about',
	/** 뉴스레터 목록 · 검색 */
	articles: '/articles',
	articlesByCategory: (categoryId: number) => `/articles?categoryId=${categoryId}`,
	articlesByKeyword: (keyword: string) => `/articles?keyword=${encodeURIComponent(keyword)}`,
	/** 뉴스레터 상세 */
	article: (id: number | string) => `/articles/detail/${id}`,
	tags: '/tags',
	terms: '/terms',
	privacy: '/privacy',
	unsubscribe: '/unsubscribe',
	loginPopup: '/login-popup',
	mypage: (tab?: MypageTab) => (tab ? `/mypage?tab=${tab}` : '/mypage'),
	admin: {
		home: '/admin',
		stats: '/admin/stats',
		/** 한 화면의 히트맵 (query: route · from · to) */
		statsPage: (query: string) => `/admin/stats/page?${query}`,
		newsletters: '/admin/newsletters',
		newsletter: (id: number) => `/admin/newsletters/${id}`,
		articles: '/admin/articles',
		aiLogs: '/admin/ai-logs',
		mail: '/admin/mail',
		jobRuns: '/admin/job-runs',
		users: '/admin/users',
		subscribers: '/admin/subscribers',
		categories: '/admin/categories',
		tags: '/admin/tags',
		ui: '/admin/ui',
	},
} as const;
