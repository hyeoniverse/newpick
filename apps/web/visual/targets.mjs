/**
 * 화면 전 · 후 비교 대상 (#229). 화면을 더하거나 열린 상태를 더하려면 여기만 고친다.
 * - auth: 로그인한 채로 찍을지 (기본 true, 관리자 · 마이페이지는 관리자 계정이어야 보인다)
 * - open: 화면을 연 뒤 할 일 (메뉴 · 검색 · 시트 열기). 이름이 파일 이름에 붙는다
 */
export const PAGES = [
	'/',
	'/about',
	'/articles',
	'/articles?keyword=%EA%B8%B0%EC%A4%80%EA%B8%88%EB%A6%AC',
	'/articles/detail/72',
	'/tags',
	'/terms',
	'/privacy',
	'/unsubscribe?token=visual',
	'/mypage?tab=subscriptions',
	'/mypage?tab=bookmarks',
	'/mypage?tab=highlights',
	'/mypage?tab=follows',
	'/mypage?tab=settings',
	'/admin',
	'/admin/stats',
	'/admin/ai-logs',
	'/admin/job-runs',
	'/admin/newsletters',
	'/admin/articles',
	'/admin/users',
	'/admin/subscribers',
	'/admin/tags',
	'/admin/mail',
	// 검색어가 든 검색 칸 (주소 → 칸에 채워짐, #230 AdminSearchField)
	'/admin/users?q=gmail',
	'/admin/subscribers?q=gmail',
	'/admin/mail?email=gmail',
	'/admin/articles?title=%EA%B8%88%EB%A6%AC',
];

/** 열린 상태: [이름, 화면, 할 일, 찍을 방식들] */
export const OPEN_STATES = [
	{
		name: 'drawer',
		path: '/',
		modes: ['mobile'],
		run: async (page) => page.getByRole('button', { name: '메뉴' }).first().click(),
	},
	{
		// 데스크톱은 검색 칸이 늘 펼쳐져 있어 휴대폰에서만
		name: 'search',
		path: '/',
		modes: ['mobile'],
		run: async (page) => page.getByRole('button', { name: '검색', exact: true }).first().click(),
	},
	{
		name: 'login-sheet',
		path: '/',
		auth: false,
		modes: ['desk-light', 'mobile'],
		run: async (page) => page.getByRole('button', { name: '로그인' }).first().click(),
	},
];

/** 찍는 방식: [이름, 폭, 테마] */
export const MODES = {
	'desk-light': { width: 1280, theme: 'light' },
	'desk-dark': { width: 1280, theme: 'dark' },
	mobile: { width: 390, theme: 'light' },
};
