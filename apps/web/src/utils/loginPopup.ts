import { SESSION_HINT_COOKIE } from '@/constants/api';

/**
 * iframe 안 로그인 (다른 hyeoniverse.com 사이트에 뉴픽을 넣었을 때).
 * 구글 로그인 화면은 iframe 안에 뜨지 않으므로(X-Frame-Options: DENY) 로그인만 팝업 창으로 연다.
 *
 * 1. iframe: openLoginPopup() → 팝업으로 /login-popup
 * 2. 팝업: /login-popup이 '팝업 로그인 중' 쿠키를 남기고 구글 로그인으로 이동 → 끝나면 /?oauthSuccess 또는 /?login=failed로 돌아옴
 * 3. 팝업: LoginPopupBridge가 그 쿠키로 자기가 팝업인 걸 알아보고, 결과를 방송하고 창을 닫음
 * 4. iframe: 결과를 받거나, 로그인 표시 쿠키(logged_in)가 생긴 걸 직접 보면 새로 고침
 *
 * 구글을 거치면 브라우저가 팝업 창을 새 환경으로 바꿔 끼워(Cross-Origin-Opener-Policy)
 * window.opener · sessionStorage가 사라질 수 있다. 그래서 표시는 쿠키로 남기고, iframe도 방송만 기다리지 않고 쿠키를 직접 본다
 */
export const LOGIN_CHANNEL = 'newpick-login';
/** 팝업 창에서 로그인 중이라는 표시 쿠키. 구글을 거쳐도 남고 10분 뒤 사라진다 */
export const POPUP_COOKIE = 'newpick_login_popup';

export type LoginPopupResult = 'ok' | 'failed' | 'blocked';

/** 다른 페이지 안(iframe)에 들어가 있는지 */
export function isEmbedded() {
	try {
		return window.self !== window.top;
	} catch {
		// 다른 출처의 top에 접근하면 예외가 나므로, 그 자체로 iframe 안이다
		return true;
	}
}

const WIDTH = 480;
const HEIGHT = 640;

const readCookie = (name: string) =>
	document.cookie
		.split('; ')
		.find((part) => part.startsWith(`${name}=`))
		?.slice(name.length + 1);

export const setPopupCookie = () => {
	document.cookie = `${POPUP_COOKIE}=1; Max-Age=600; Path=/; SameSite=Lax; Secure`;
};
export const clearPopupCookie = () => {
	document.cookie = `${POPUP_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
};
export const isLoginPopup = () => readCookie(POPUP_COOKIE) === '1';

/** 로그인 표시 쿠키(api가 로그인 때 발급) */
const loggedIn = () => readCookie(SESSION_HINT_COOKIE) === '1';

const POLL_MS = 1000;

/**
 * 팝업으로 로그인하고 결과를 기다린다. 팝업이 막혔으면 바로 'blocked'.
 * 팝업의 방송(성공 · 실패)이나, 로그인 표시 쿠키가 새로 생긴 것 중 먼저 오는 쪽으로 끝낸다.
 * 쿠키는 1초마다, 그리고 이 창으로 돌아올 때(focus · 보이게 됨) 바로 본다
 */
export function openLoginPopup(): Promise<LoginPopupResult> {
	const left = Math.max(0, window.screenX + (window.outerWidth - WIDTH) / 2);
	const top = Math.max(0, window.screenY + (window.outerHeight - HEIGHT) / 2);
	const popup = window.open(
		'/login-popup',
		'newpick-login',
		`popup=yes,width=${WIDTH},height=${HEIGHT},left=${left},top=${top}`,
	);
	if (!popup) return Promise.resolve('blocked');

	const wasLoggedIn = loggedIn();
	return new Promise((resolve) => {
		const channel = 'BroadcastChannel' in window ? new BroadcastChannel(LOGIN_CHANNEL) : null;
		const finish = (result: LoginPopupResult) => {
			channel?.close();
			clearInterval(timer);
			window.removeEventListener('focus', check);
			document.removeEventListener('visibilitychange', check);
			resolve(result);
		};
		const check = () => {
			if (!wasLoggedIn && loggedIn()) finish('ok');
		};
		if (channel) channel.onmessage = (event: MessageEvent<{ ok: boolean }>) => finish(event.data?.ok ? 'ok' : 'failed');
		const timer = setInterval(check, POLL_MS);
		window.addEventListener('focus', check);
		document.addEventListener('visibilitychange', check);
	});
}
