/**
 * 브라우저에 남기는 값의 이름 (쿠키 · localStorage · sessionStorage). 이름을 바꾸면 이미 저장된 값을 못 읽으니 그대로 둔다
 */

/** 쿠키 */
export const COOKIES = {
	/** 인증 토큰 (api가 httpOnly로 발급, middleware가 읽기만) */
	access: 'access_token',
	refresh: 'refresh_token',
	/** 로그인 여부만 알려 주는 표시 (토큰 아님, api가 발급). 정적 페이지에서 첫 화면의 로그인 상태를 정할 때 쓴다 */
	sessionHint: 'logged_in',
	/** 로그인 팝업 창 안에서 열렸다는 표시 (10분) */
	loginPopup: 'newpick_login_popup',
} as const;

/** localStorage · sessionStorage */
export const STORAGE_KEYS = {
	/** 라이트 · 다크 (localStorage) */
	theme: 'newpick_theme',
	/** 방문 한 번을 묶는 id (sessionStorage) */
	visit: 'np-visit',
	/** '1'이면 자동화 브라우저에서도 방문 기록을 보낸다 (localStorage, 직접 확인용) */
	trackDebug: 'np-track-debug',
} as const;
