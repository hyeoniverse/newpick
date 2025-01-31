import { cookies } from 'next/headers';
import { API_ENDPOINTS } from '@/constants/api';

export const fetchUserWithSubscription = async () => {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get('access_token')?.value;

	if (!accessToken) {
		return null;
	}

	// 사용자 프로필 가져오기
	let response = await fetch(API_ENDPOINTS.MY.PROFILE(), {
		method: 'GET',
		cache: 'no-store',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Cookie: `access_token=${accessToken}`,
		},
	});

	if (!response.ok) {
		const errorMessage = `사용자 정보 불러오기 실패: ${response.status}`;
		console.error(`❌ ${errorMessage}`);
		return null;
	}

	const user = await response.json();

	// 구독 상태 가져오기
	response = await fetch(API_ENDPOINTS.SUBSCRIBERS.STATUS(), {
		method: 'GET',
		cache: 'no-store',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Cookie: `access_token=${accessToken}`,
		},
	});

	if (!response.ok) {
		const errorMessage = `구독 상태 불러오기 실패: ${response.status}`;
		console.error(`❌ ${errorMessage}`);
		return null;
	}

	const subscription = await response.json();

	// `user` 객체에 `isSubscribed` 추가
	return {
		...user,
		isSubscribed: subscription.status === 'active' ? true : subscription.status === 'paused' ? false : null,
	};
};
