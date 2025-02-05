import { User } from '@/models/user.model';
import { API_ENDPOINTS } from '@/constants/api';
import { fetchSubscription } from '@/api/subscription';
import { fetchInterests } from '@/api/interests';
import { mapTitleToId } from '@/utils/mapInterests';

// 로그인 API
export const loginUser = async (): Promise<void> => {
	// OAuth 로그인 페이지로 리다이렉트
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
	} catch (error) {
		console.log('❌ 구독 상태 및 관심사 불러오기 실패:', error);
		return user;
	}
};

// 사용자 정보 조회 API
export const fetchUser = async (): Promise<User> => {
	try {
		const response = await fetch(API_ENDPOINTS.MY.PROFILE(), {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`사용자 정보를 불러오는데 실패했습니다. status: ${response.status}`);
		}

		const userData = await response.json();
		const user = await fetchAdditionalUserData(userData);

		if (!user) {
			throw new Error('사용자 정보를 불러오는데 실패했습니다.');
		}

		return user;
	} catch (error) {
		console.error('❌ 사용자 정보 조회 실패:', error);
		throw new Error('사용자 정보를 불러오는데 실패했습니다.');
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

		if (!response.ok) {
			console.error(`로그아웃에 실패했습니다. ${response.status}`);
		}
	} catch (error) {
		console.error('❌ 로그아웃 실패:', error);
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

		if (!response.ok) {
			throw new Error(`토큰 재발급에 실패했습니다. ${response.status}`);
		}

		const data = await response.json();
		return data.access_token;
	} catch (error) {
		console.error('❌ 토큰 재발급 실패:', error);
		throw error;
	}
};

// 인증이 필요한 API 요청 함수
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
	try {
		let response = await fetch(url, {
			...options,
			credentials: 'include', // 인증 정보를 포함
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		// 401 Unauthorized 발생 시
		if (response.status === 401) {
			// 만약 refresh 엔드포인트 자체에서 401이 발생하면 재시도하지 않음
			if (url === API_ENDPOINTS.AUTH.REFRESH()) {
				console.error('❌ Refresh 엔드포인트에서 401 발생. 토큰 재발급이 불가능합니다.');
				await logoutUser();
				throw new Error('로그인 후 이용해주세요.');
			}

			console.warn('🔄 토큰이 만료됨. 새로운 토큰을 요청합니다.');
			try {
				await refreshToken();
				console.info('✅ 토큰 재발급 성공. 요청을 재시도합니다.');

				// 재발급 후 재요청
				response = await fetch(url, {
					...options,
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						...options.headers,
					},
				});

				// 여전히 401이면 재시도하지 않고 로그아웃 처리
				if (response.status === 401) {
					console.error('❌ 재발급된 토큰으로도 인증 실패. 로그아웃합니다.');
					await logoutUser();
					throw new Error('로그인 후 이용해주세요.');
				}
			} catch (refreshError) {
				console.error('❌ 토큰 재발급 실패:', refreshError);
				await logoutUser();
				throw new Error('로그인 후 이용해주세요.');
			}
		}

		return response;
	} catch (error) {
		console.error('❌ API 요청 실패:', error);
		throw error;
	}
};
