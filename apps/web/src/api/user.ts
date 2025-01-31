import { cookies } from 'next/headers';
import { API_ENDPOINTS } from '@/constants/api';

export const fetchUserWithSubscription = async () => {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token')?.value;

		if (!accessToken) {
			console.warn('⚠️ No access token found.');
			return null;
		}

		// 사용자 프로필 가져오기
		const userResponse = await fetch(API_ENDPOINTS.MY.PROFILE(), {
			method: 'GET',
			cache: 'no-store',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Cookie: `access_token=${accessToken}`,
			},
		});

		if (!userResponse.ok) {
			console.error(`❌ 사용자 정보 불러오기 실패: ${userResponse.status}`);
			return null;
		}

		const user = await userResponse.json();

		// 구독 상태 가져오기 (이 요청이 실패해도 `user` 정보는 유지)
		try {
			const subscriptionResponse = await fetch(API_ENDPOINTS.SUBSCRIBERS.STATUS(), {
				method: 'GET',
				cache: 'no-store',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Cookie: `access_token=${accessToken}`,
				},
			});

			if (!subscriptionResponse.ok) {
				console.warn(`⚠️ 구독 상태 불러오기 실패: ${subscriptionResponse.status}`);
				return { ...user, isSubscribed: null }; // user 정보는 유지, 구독 상태만 null
			}

			const subscription = await subscriptionResponse.json();
			return {
				...user,
				isSubscribed: subscription.status === 'active' ? true : subscription.status === 'paused' ? false : null,
			};
		} catch (subscriptionError) {
			console.error('❌ 구독 상태 가져오는 중 오류 발생:', subscriptionError);
			return { ...user, isSubscribed: null };
		}
	} catch (error) {
		console.error('❌ fetchUserWithSubscription 오류 발생:', error);
		return null;
	}
};
