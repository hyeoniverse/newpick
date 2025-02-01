import { User as IUser } from '@/models/user.model';
import { cookies } from 'next/headers';
import { API_ENDPOINTS } from '@/constants/api';

export const fetchUserWithSubscription = async (retry = false): Promise<IUser | null> => {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token')?.value;

		if (!accessToken) {
			console.log('⚠️ No access token found.');
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

		// 사용자 정보 요청 실패 시 토큰 갱신 후 1회 재시도
		if (!userResponse.ok) {
			console.log(`❌ 사용자 정보 불러오기 실패: ${userResponse.status}`);

			if (!retry) {
				console.log('🔄 액세스 토큰 만료됨. 새 토큰을 요청하여 재시도합니다.');
				const newAccessToken = await refreshToken(accessToken);

				if (newAccessToken) {
					return await fetchUserWithSubscription(true); // 1회 재시도
				}
			}

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
				console.log(`⚠️ 구독 상태 불러오기 실패: ${subscriptionResponse.status}`);
				return { ...user, isSubscribed: null }; // user 정보는 유지, 구독 상태만 null
			}

			const subscription = await subscriptionResponse.json();
			return {
				...user,
				isSubscribed: subscription.status === 'active' ? true : subscription.status === 'paused' ? false : null,
			};
		} catch (subscriptionError) {
			console.log('❌ 구독 상태 가져오는 중 오류 발생:', subscriptionError);
			return { ...user, isSubscribed: null };
		}
	} catch (error) {
		console.log('❌ fetchUserWithSubscription 오류 발생:', error);
		return null;
	}
};

// 새 액세스 토큰을 요청
const refreshToken = async (accessToken: string): Promise<string | null> => {
	try {
		const refreshResponse = await fetch(API_ENDPOINTS.AUTH.REFRESH(), {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `access_token=${accessToken}`,
			},
		});

		if (!refreshResponse.ok) {
			console.log(`❌ 토큰 갱신 실패: ${refreshResponse.status}`);
			return null;
		}

		const data = await refreshResponse.json();
		const newAccessToken = data?.access_token;

		if (newAccessToken) {
			console.log('✅ 새 액세스 토큰 발급 완료.');
			return newAccessToken;
		}

		return null;
	} catch (error) {
		console.log('❌ refreshToken 요청 중 오류 발생:', error);
		return null;
	}
};
