import { User } from '@/models/user.model';
import { API_ENDPOINTS } from '@/constants/api';
import { fetchSubscription } from '@/api/subscription';
import { fetchInterests } from '@/api/interests';
import { mapTitleToId } from '@/utils/mapInterests';
import { apiFetch } from '@/api/client';

// 로그인: /api/auth/google로 이동하면 백엔드가 Google OAuth로 리다이렉트합니다.
export const loginUser = async (): Promise<void> => {
	window.location.href = API_ENDPOINTS.AUTH.LOGIN();
};

// 추가 사용자 데이터 불러오기 (구독 상태, 관심사)
export const fetchAdditionalUserData = async (user: User): Promise<User> => {
	try {
		const [subscription, interests] = await Promise.all([fetchSubscription(), fetchInterests()]);
		return {
			...user,
			isSubscribed: subscription,
			interests: mapTitleToId(interests),
		};
	} catch {
		return user;
	}
};

// 사용자 정보 조회 API (브라우저). 401이면 apiFetch가 토큰 갱신 후 한 번 다시 시도합니다.
export const fetchUser = async (): Promise<User> => {
	const userData = await apiFetch<User>(API_ENDPOINTS.MY.PROFILE());
	return fetchAdditionalUserData(userData);
};

// 로그아웃 API
export const logoutUser = async (): Promise<void> => {
	await apiFetch(API_ENDPOINTS.AUTH.LOGOUT(), { method: 'POST', retryOnUnauthorized: false });
};
