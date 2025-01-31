import { User } from '@/models/user.model';
import { API_ENDPOINTS, BACK_URL } from '@/constants/api';
import { POPUP } from '@/constants/numbers';
import { fetchSubscription } from '@/api/subscription';
import { fetchInterests } from '@/api/interests';

// 로그인 API
export const loginUser = async (setUser: (user: User) => void): Promise<User> => {
	return new Promise((resolve, reject) => {
		window.open(`${API_ENDPOINTS.AUTH.LOGIN()}`, '_blank', `width=${POPUP.WIDTH}, height=${POPUP.HEIGHT}`);

		// 메시지 이벤트 리스너 등록
		const listener = async (event: MessageEvent) => {
			if (event.origin !== BACK_URL) return;
			if (event.data?.type === 'oauthSuccess') {
				const { user } = event.data;

				if (!user) {
					reject(new Error(`사용자 정보를 불러오는데 실패했습니다. ${event.data?.error}`));
					return;
				}

				// 기본 사용자 정보 먼저 저장
				setUser(user);
				window.removeEventListener('message', listener);

				// 추가 사용자 데이터 비동기 업데이트
				const updatedUser = await fetchAdditionalUserData(user);
				resolve(updatedUser);
			}
		};

		// 이벤트 리스너 등록
		window.addEventListener('message', listener);
	});
};

// 추가 사용자 데이터 불러오기(구독 상태, 관심사)
export const fetchAdditionalUserData = async (user: User): Promise<User> => {
	try {
		// 구독 상태 & 관심사 가져오기
		const [subscription, interests] = await Promise.all([fetchSubscription(), fetchInterests()]);

		const updatedUser = {
			...user,
			isSubscribed: subscription,
			interests,
		};

		return updatedUser;
	} catch (error) {
		console.error('❌ 구독 상태 및 관심사 불러오기 실패:', error);
		return user;
	}
};

// 사용자 정보 조회 API
export const fetchUser = async (): Promise<User> => {
	const response = await fetch(API_ENDPOINTS.MY.PROFILE(), {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) throw new Error(`사용자 정보를 불러오는데 실패했습니다. ${response.status}`);

	const user = await fetchAdditionalUserData(await response.json());
	return user;
};

// 로그아웃 API
export const logoutUser = async (): Promise<void> => {
	const response = await fetch(API_ENDPOINTS.AUTH.LOGOUT(), {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) throw new Error(`로그아웃에 실패했습니다. ${response.status}`);
};

// 만료 토큰 재발급 API
export const refreshToken = async (): Promise<void> => {
	const response = await fetch(API_ENDPOINTS.AUTH.REFRESH(), {
		method: 'GET',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) throw new Error(`토큰 재발급에 실패했습니다. ${response.status}`);
};

// `fetchUser` 요청을 감싸는 함수: 401 발생 시 1번만 재시도
export const fetchUserWithRefresh = async () => {
	try {
		return await fetchUser();
	} catch (error: unknown) {
		if ((error as { response?: { status?: number } }).response?.status === 401) {
			console.warn('🔄 Access Token 만료됨, Refresh Token으로 갱신 시도...');
			try {
				await refreshToken();
				console.info('✅ Access Token 갱신 완료. fetchUser 다시 시도...');
				return await fetchUser(); // **새로운 access_token으로 한 번만 다시 시도**
			} catch (refreshError) {
				console.error('❌ Refresh Token 만료됨. 로그아웃 처리');
				throw refreshError;
			}
		}

		throw error;
	}
};
