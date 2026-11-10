'use client';

import { useEffect } from 'react';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { useToast } from '@/hooks/useToast';

/**
 * 서버가 보낸 ?login= 을 읽어 알린다. 화면마다가 아니라 레이아웃에서 한 번만 쓴다
 * - required: 로그인이 필요한 화면에 로그인 없이 와서 홈으로 보내짐 (middleware) → 로그인 창
 * - failed: 구글 로그인이 취소·실패해 돌아옴 (API) → 안내 후 로그인 창
 */
export default function LoginParamNotice() {
	const openLogin = useOpenLogin();
	const { showToast } = useToast();

	useEffect(() => {
		const url = new URL(window.location.href);
		const reason = url.searchParams.get('login');
		if (!reason) return;

		if (reason === 'required') openLogin('로그인이 필요한 화면입니다');
		if (reason === 'failed') {
			showToast('로그인하지 못했습니다. 다시 시도해 주십시오.', 'error');
			openLogin();
		}

		// 새로 고침해도 다시 뜨지 않게 주소에서 지운다
		url.searchParams.delete('login');
		window.history.replaceState(null, '', url.pathname + url.search + url.hash);
	}, [openLogin, showToast]);

	return null;
}
