/** 백엔드 주소. 서버(SSR, middleware, next.config rewrites)에서만 사용합니다. */
export const BACK_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * 브라우저는 /api(Next rewrites 프록시)를 거쳐 백엔드에 요청합니다.
 * 같은 도메인으로 요청하므로 인증 쿠키가 프론트 도메인에 저장되고, 별도 CORS·쿠키 도메인 설정이 필요 없습니다.
 */
export const API_URL = typeof window === 'undefined' ? BACK_URL : '/api';
export const PROTECTED = ['/mypage', '/admin']; // 로그인이 필요한 경로 (middleware에서 확인)
/** 로그인 여부만 알려 주는 표시 쿠키 (토큰 아님, api가 발급). 정적 페이지에서 첫 화면의 로그인 상태를 정할 때 씁니다. */
export const SESSION_HINT_COOKIE = 'logged_in';

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: () => `${API_URL}/auth/google`,
		LOGOUT: () => `${API_URL}/auth/logout`,
		REFRESH: () => `${API_URL}/auth/refresh`,
	},
	ADMIN: {
		/** 사이트 캐시 비우기 (#73) */
		SITE_CACHE_REFRESH: () => `${API_URL}/admin/site-cache/refresh`,
		/** CMS (#31): 사용자 · 구독자 · 관심사 현황 · 뉴스레터 고치기 */
		USERS: (query: string) => `${API_URL}/admin/users${query ? `?${query}` : ''}`,
		USER: (id: number) => `${API_URL}/admin/users/${id}`,
		SUBSCRIBERS: (query: string) => `${API_URL}/admin/subscribers${query ? `?${query}` : ''}`,
		CATEGORIES: () => `${API_URL}/admin/categories`,
		NEWSLETTER: (id: number) => `${API_URL}/newsletters/${id}`,
		NEWSLETTER_RESET_VIEWS: (id: number) => `${API_URL}/newsletters/reset-viewcount/${id}`,
		/** 태그 정돈 (#20): 규칙 목록 · 합치기 · 지우기 · 규칙 지우기 */
		TAG_RULES: () => `${API_URL}/admin/tags/rules`,
		TAG_RULE: (id: number) => `${API_URL}/admin/tags/rules/${id}`,
		TAG_MERGE: () => `${API_URL}/admin/tags/merge`,
		TAG_REMOVE: () => `${API_URL}/admin/tags/remove`,
		/** 관리자 대시보드: 스케줄러 · 수집 · 발행 · AI 요약 기록 · 발송 (#21) */
		DASHBOARD: () => `${API_URL}/scheduler/dashboard`,
		/** 상세 목록 (기간 · 쪽 등 쿼리스트링을 붙여 부른다) */
		LIST: (kind: 'newsletters' | 'mails' | 'ai-logs' | 'job-runs' | 'articles', query: string) =>
			`${API_URL}/scheduler/dashboard/${kind}?${query}`,
		/** 통계 (#122): 구독자 · AI 비용 · 발송 (쿼리 from · to) */
		STATS: (kind: 'subscribers' | 'cost' | 'delivery' | 'traffic' | 'page' | 'taste', query: string) =>
			`${API_URL}/scheduler/stats/${kind}?${query}`,
		/** 예약 작업 시간 (GET 보기 · PUT 바꾸기) */
		SCHEDULE: () => `${API_URL}/scheduler/schedule`,
		/** 그날 메일을 받은 사람 */
		MAIL_RECIPIENTS: (date: string) => `${API_URL}/scheduler/dashboard/mail?date=${date}`,
		/** 스케줄러 켜기 · 끄기 (본문 { enable }) */
		TOGGLE: (job: 'crawling' | 'ai-summary' | 'mail-send') => `${API_URL}/scheduler/toggle/${job}`,
		/** 지금 실행 (응답은 바로 오고 작업은 서버에서 계속) */
		RUN_NOW: (job: 'crawling' | 'ai-summary' | 'mail-send') => `${API_URL}/scheduler/manual/${job}`,
	},
	MY: {
		PROFILE: () => `${API_URL}/mypage/profile`,
		BOOKMARKS: () => `${API_URL}/mypage/bookmarks`,
		/** 내가 실제로 받은 메일 (보낸 시각별 한 통씩) */
		MAILS: (offset: number, limit: number) => `${API_URL}/mypage/mails?offset=${offset}&limit=${limit}`,
		/** 받은 메일 한 통을 받은 그대로 (sentAt: 목록의 값 그대로) */
		MAIL: (sentAt: string) => `${API_URL}/mypage/mails/view?sentAt=${encodeURIComponent(sentAt)}`,
		/** 회원 탈퇴 (#65) */
		ACCOUNT: () => `${API_URL}/mypage/account`,
		/** 스크랩 · 메모 (#123). newsletterId를 주면 그 뉴스레터 것만 */
		HIGHLIGHTS: (newsletterId?: number) =>
			`${API_URL}/mypage/highlights${newsletterId ? `?newsletterId=${newsletterId}` : ''}`,
		HIGHLIGHT: (id: number) => `${API_URL}/mypage/highlights/${id}`,
		/** 선택한 스크랩 지우기 (POST { ids }) */
		HIGHLIGHTS_DELETE: () => `${API_URL}/mypage/highlights/delete`,
		/** 내 취향 점수 (#123 2단계): 북마크 · 스크랩 · 메모로 모은 태그 · 관심사 */
		TASTE: () => `${API_URL}/mypage/taste`,
	},
	SUBSCRIBERS: {
		STATUS: () => `${API_URL}/subscribers/status`,
		HISTORY: () => `${API_URL}/subscribers/history`,
		INTERESTS: () => `${API_URL}/mypage/interests`,
		START: () => `${API_URL}/subscribers/start`,
		PAUSE: () => `${API_URL}/subscribers/pause`,
		CANCEL: () => `${API_URL}/subscribers/cancel`,
		/** 메일의 원클릭 수신 거부 (#18). 로그인 없이 토큰으로 */
		UNSUBSCRIBE: (token: string) => `${API_URL}/subscribers/unsubscribe?token=${encodeURIComponent(token)}`,
	},
	/** 서비스 문의처 (구독 메일 발송 주소) */
	CONTACT: () => `${API_URL}/contact`,
	EDITION: {
		/** 고른 분야로 엮은 구독 메일 미리보기 (#55). 생성 없음 */
		PREVIEW: (categoryIds: number[]) => `${API_URL}/edition/preview?categories=${categoryIds.join(',')}`,
	},
	NEWSLETTER: {
		BASE: `${API_URL}/newsletters`,
		VIEW_COUNT: (newsletterId: number) => `${API_URL}/newsletters/viewcount/${newsletterId}`,
		LIST: (limit: number, offset: number, popular?: boolean) =>
			popular
				? `${API_URL}/newsletters?limit=${limit}&offset=${offset}&popular=${popular}`
				: `${API_URL}/newsletters?limit=${limit}&offset=${offset}`,
		CATEGORY: (category: number, limit: number, offset: number) =>
			`${API_URL}/newsletters/category/${category}?limit=${limit}&offset=${offset}`,
		/** 지난 뉴스레터 검색 · 필터 (#20). 쿼리스트링은 utils/newsletterSearch가 만든다 */
		/** 최근 자주 나온 키워드(태그) (#20) */
		KEYWORDS: (categoryId?: number) =>
			`${API_URL}/newsletters/keywords?days=30&limit=12` + (categoryId ? `&categoryId=${categoryId}` : ''),
		/** 태그 전체 (태그 화면 /tags) */
		ALL_KEYWORDS: (categoryId?: number) =>
			`${API_URL}/newsletters/keywords/all` + (categoryId ? `?categoryId=${categoryId}` : ''),
		SEARCH: (query: string) => `${API_URL}/newsletters/search${query ? `?${query}` : ''}`,
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
