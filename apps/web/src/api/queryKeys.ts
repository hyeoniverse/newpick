/**
 * React Query 열쇠를 한 곳에서 만든다. 화면마다 문자열 배열을 손으로 적으면 이름 · 순서가 어긋나
 * 다시 불러오기(invalidate)가 빗나가기 쉽다.
 * - 열쇠의 첫 칸(뿌리)으로 묶어 다시 불러온다: invalidateQueries({ queryKey: queryKeys.bookmarks.all })
 * - 로그아웃 때 남기는 공개 결과는 PUBLIC_QUERY_ROOTS (hooks/useAuth.ts)
 */
export const queryKeys = {
	// ---- 공개 (누구에게나 같은 결과) ----
	articles: {
		list: (limit: number, offset: number) => ['articleList', limit, offset] as const,
		content: (slug: string | number) => ['articleContent', slug] as const,
		popular: (limit: number, offset: number, trend?: boolean) => ['popularArticles', limit, offset, trend] as const,
		related: (urls: string) => ['relatedNews', urls] as const,
	},
	keywords: {
		/** 모든 관심사의 키워드 (다시 불러오기용 뿌리) */
		all: ['allKeywords'] as const,
		byCategory: (categoryId: number) => ['allKeywords', categoryId] as const,
		popularAll: ['popularKeywords'] as const,
		popular: (categoryId: number | undefined) => ['popularKeywords', categoryId] as const,
	},
	trends: ['trends'] as const,

	// ---- 로그인 없이 쓰지만 사람마다 다른 것 ----
	editionPreview: (ids: number[]) => ['edition-preview', ids] as const,
	unsubscribe: (token: string) => ['unsubscribe', token] as const,

	// ---- 로그인한 사람 것 (로그아웃 · 탈퇴하면 지운다) ----
	user: ['user'] as const,
	subscription: {
		status: ['subscriptionStatus'] as const,
		interests: ['subscriptionInterests'] as const,
	},
	personalMail: ['personal-mail'] as const,
	loginSessions: ['login-sessions'] as const,
	tagFollows: ['tag-follows'] as const,
	folders: {
		all: ['folders'] as const,
		list: (userId?: number) => ['folders', userId] as const,
	},
	bookmarks: {
		all: ['bookmarks'] as const,
		list: (userId?: number) => ['bookmarks', userId] as const,
		page: (userId: number | undefined, filters: string) => ['bookmarks', 'page', userId, filters] as const,
		count: (userId?: number) => ['bookmarks', 'count', userId] as const,
	},
	highlights: {
		all: ['highlights'] as const,
		list: (userId: number | undefined, newsletterId?: number) => ['highlights', userId, newsletterId ?? 'all'] as const,
		page: (userId: number | undefined, filters: string, startOffset: number) =>
			['highlights', 'page', userId, filters, startOffset] as const,
		count: (userId?: number) => ['highlights', 'count', userId] as const,
	},
	taste: {
		all: ['taste'] as const,
		mine: (userId?: number) => ['taste', userId] as const,
	},
	mails: {
		all: ['myMails'] as const,
		page: (userId: number | undefined, filters: string, startOffset: number) =>
			['myMails', userId, filters, startOffset] as const,
		count: (userId?: number) => ['myMails', userId, 'count'] as const,
		one: (sentAt: string) => ['myMail', sentAt] as const,
	},
	follows: {
		all: ['follows'] as const,
		list: (userId?: number) => ['follows', userId, 'list'] as const,
		unseen: (userId?: number) => ['follows', userId, 'unseen'] as const,
		newsletter: (userId: number | undefined, newsletterId: number) =>
			['follows', userId, 'newsletter', newsletterId] as const,
		updates: (userId: number | undefined, newsletterId: number) =>
			['follows', userId, 'newsletter', newsletterId, 'updates'] as const,
	},

	// ---- 관리자 ----
	admin: {
		dashboard: {
			all: ['adminDashboard'] as const,
			range: (from: string, to: string) => ['adminDashboard', from, to] as const,
		},
		mailRecipients: (date: string) => ['adminMailRecipients', date] as const,
		schedule: ['adminSchedule'] as const,
		articles: (query: string) => ['adminArticles', query] as const,
		jobRuns: (query: string) => ['adminJobRuns', query] as const,
		mails: (query: string) => ['adminMails', query] as const,
		aiLogs: {
			all: ['adminAiLogs'] as const,
			list: (query: string) => ['adminAiLogs', query] as const,
		},
		users: {
			all: ['adminUsers'] as const,
			list: (query: string) => ['adminUsers', query] as const,
		},
		subscribers: (query: string) => ['adminSubscribers', query] as const,
		categories: ['adminCategories'] as const,
		tagRules: ['tagRules'] as const,
		newsletters: {
			all: ['adminNewsletters'] as const,
			list: (query: string) => ['adminNewsletters', query] as const,
			day: (date: string) => ['adminNewsletters', 'day', date] as const,
		},
		newsletter: (id: number) => ['adminNewsletter', id] as const,
		stats: (kind: 'subscribers' | 'cost' | 'traffic' | 'delivery' | 'page', query: string) =>
			['adminStats', kind, query] as const,
		tasteStats: ['adminStats', 'taste'] as const,
	},
};
