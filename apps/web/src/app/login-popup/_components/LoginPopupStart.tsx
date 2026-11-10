'use client';

import { useEffect } from 'react';
import { API_ENDPOINTS } from '@/constants/api';
import { setPopupCookie } from '@/utils/loginPopup';
import Spinner from '@/components/common/loader/Spinner';

export default function LoginPopupStart() {
	useEffect(() => {
		// 구글을 거쳐 돌아온 이 창이 팝업인 걸 알아보도록 쿠키로 남긴다 (sessionStorage는 구글을 거치며 사라질 수 있음)
		setPopupCookie();
		window.location.replace(API_ENDPOINTS.AUTH.LOGIN());
	}, []);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '6rem 1rem' }}>
			<Spinner />
			<p>구글 로그인으로 이동하는 중…</p>
		</div>
	);
}
