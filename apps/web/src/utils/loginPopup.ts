/**
 * iframe 안 로그인 (다른 hyeoniverse.com 사이트에 뉴픽을 넣었을 때).
 * 구글 로그인 화면은 iframe 안에 뜨지 않으므로(X-Frame-Options: DENY) 로그인만 팝업 창으로 연다.
 *
 * 1. iframe: openLoginPopup() → 팝업으로 /login-popup
 * 2. 팝업: /login-popup이 표시를 남기고 구글 로그인으로 이동 → 끝나면 /?oauthSuccess 또는 /?login=failed로 돌아옴
 * 3. 팝업: LoginPopupBridge가 결과를 방송하고 창을 닫음
 * 4. iframe: 결과를 받아 새로 고침(로그인 쿠키는 같은 사이트라 iframe에도 그대로 쓰임)
 *
 * 구글을 거치면 팝업과 원래 창의 연결(window.opener)이 끊길 수 있어, 같은 사이트끼리 쓰는 BroadcastChannel로 알린다
 */
export const LOGIN_CHANNEL = 'newpick-login';
/** 팝업 창 안에서 로그인 중이라는 표시 (sessionStorage, 이 창에서만) */
export const POPUP_FLAG = 'newpick:login-popup';

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

/** 팝업으로 로그인하고 결과를 기다린다. 팝업이 막혔으면 바로 'blocked' */
export function openLoginPopup(): Promise<LoginPopupResult> {
	const left = Math.max(0, window.screenX + (window.outerWidth - WIDTH) / 2);
	const top = Math.max(0, window.screenY + (window.outerHeight - HEIGHT) / 2);
	const popup = window.open(
		'/login-popup',
		'newpick-login',
		`popup=yes,width=${WIDTH},height=${HEIGHT},left=${left},top=${top}`,
	);
	if (!popup) return Promise.resolve('blocked');

	return new Promise((resolve) => {
		const channel = new BroadcastChannel(LOGIN_CHANNEL);
		channel.onmessage = (event: MessageEvent<{ ok: boolean }>) => {
			channel.close();
			resolve(event.data?.ok ? 'ok' : 'failed');
		};
	});
}
