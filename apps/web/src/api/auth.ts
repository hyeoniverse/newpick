import { User } from '@/models/user.model';
import { API_ENDPOINTS, BACK_URL } from '@/constants/api';
import { POPUP } from '@/constants/numbers';
import { fetchSubscription } from '@/api/subscription';
import { fetchInterests } from '@/api/interests';
import { mapTitleToId } from '@/utils/mapInterests';

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
			interests: mapTitleToId(interests),
		};

		return updatedUser;
	} catch (error) {
		console.log('❌ 구독 상태 및 관심사 불러오기 실패:', error);
		return user;
	}
};

// 사용자 정보 조회 API
export const fetchUser = async (): Promise<User> => {
	try {
		const response = await fetchWithAuth(API_ENDPOINTS.MY.PROFILE(), {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) console.log(`사용자 정보를 불러오는데 실패했습니다. ${response.status}`);

		const user = await fetchAdditionalUserData(await response.json());
		return user;
	} catch (error) {
		console.log('❌ 사용자 정보 조회 실패:', error);
		throw error;
	}
};

// 로그아웃 API
export const logoutUser = async (): Promise<void> => {
	try {
		const response = await fetch(API_ENDPOINTS.AUTH.LOGOUT(), {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) console.log(`로그아웃에 실패했습니다. ${response.status}`);
	} catch (error) {
		console.log('❌ 로그아웃 실패:', error);
		throw error;
	}
};

// 만료 토큰 재발급 API
export const refreshToken = async (): Promise<string> => {
	try {
		const response = await fetch(API_ENDPOINTS.AUTH.REFRESH(), {
			method: 'GET',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) throw new Error(`토큰 재발급에 실패했습니다. ${response.status}`);

		return (await response.json()).access_token;
	} catch (error) {
		console.log('❌ 토큰 재발급 실패:', error);
		throw error;
	}
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
	try {
		let response = await fetch(url, {
			...options,
			credentials: 'include', // 인증 정보를 포함
			headers: {
				...options.headers,
				'Content-Type': 'application/json',
			},
		});

		// Unauthorized(401) 에러 발생 시 토큰 갱신 후 재시도
		if (response.status === 401) {
			console.warn('🔄 토큰이 만료됨. 새로운 토큰을 요청합니다.');
			try {
				await refreshToken(); // 토큰 재발급 요청
				console.info('✅ 토큰 재발급 성공. 요청을 재시도합니다.');

				// 토큰 갱신 후 다시 요청
				response = await fetch(url, {
					...options,
					credentials: 'include',
					headers: {
						...options.headers,
						'Content-Type': 'application/json',
					},
				});

				// 여전히 401이면 로그아웃 처리
				if (response.status === 401) {
					console.log('❌ 재발급된 토큰으로도 인증 실패. 로그아웃합니다.');
					alert('세션이 만료되었습니다. 다시 로그인해주세요.');
					await logoutUser();
				}
			} catch (refreshError) {
				console.log('❌ 토큰 재발급 실패:', refreshError);
				await logoutUser();
			}
		}

		return response;
	} catch (error) {
		console.log('❌ API 요청 실패:', error);
		throw error;
	}
};
