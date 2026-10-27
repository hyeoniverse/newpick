'use client';

import { useEffect, useState } from 'react';
import { LOGIN_CHANNEL, POPUP_FLAG } from '@/utils/loginPopup';

/** 팝업 창이면 돌아온 주소의 결과(ok · failed)를, 아니면 null. 다른 컴포넌트가 주소를 지우기 전에 첫 그리기에서 읽는다 */
function readPopupResult(): boolean | null {
	if (typeof window === 'undefined') return null;
	try {
		if (sessionStorage.getItem(POPUP_FLAG) !== '1') return null;
	} catch {
		return null;
	}
	const params = new URLSearchParams(window.location.search);
	if (params.has('oauthSuccess')) return true;
	if (params.get('login') === 'failed') return false;
	return null;
}

/**
 * iframe 안 로그인 팝업의 마지막 단계 (utils/loginPopup.ts).
 * 구글 로그인을 마치고 이 창으로 돌아오면 결과를 iframe에 알리고 창을 닫는다. 팝업이 아니면 아무것도 하지 않는다
 */
export default function LoginPopupBridge() {
	const [result] = useState(readPopupResult);

	useEffect(() => {
		if (result === null) return;
		try {
			sessionStorage.removeItem(POPUP_FLAG);
		} catch {}
		const channel = new BroadcastChannel(LOGIN_CHANNEL);
		channel.postMessage({ ok: result });
		channel.close();
		window.close();
	}, [result]);

	return null;
}
