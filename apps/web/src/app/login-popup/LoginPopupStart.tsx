'use client';

import { useEffect } from 'react';
import { API_ENDPOINTS } from '@/constants/api';
import { POPUP_FLAG } from '@/utils/loginPopup';
import Spinner from '@/components/common/loader/Spinner';

export default function LoginPopupStart() {
	useEffect(() => {
		try {
			sessionStorage.setItem(POPUP_FLAG, '1');
		} catch {
			// 저장이 막혀 있으면 돌아와서 결과를 알리지 못한다. 그래도 로그인 자체는 된다
		}
		window.location.replace(API_ENDPOINTS.AUTH.LOGIN());
	}, []);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '6rem 1rem' }}>
			<Spinner />
			<p>구글 로그인으로 이동하는 중…</p>
		</div>
	);
}
