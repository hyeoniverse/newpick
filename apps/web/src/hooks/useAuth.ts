import { useEffect } from 'react';
import { User } from '@/models/user.model';
import { API_URL, TOKEN, API_ENDPOINTS } from '@/constants/api';
import { POPUP } from '@/constants/numbers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCookie } from '@/hooks/useCookie';
import { useAuthStore } from '@/stores/useAuthStore';

export const useAuth = () => {
	const { setCookie, deleteCookie, getAuthCookies } = useCookie();
	const { user, setUser, isLoading, setIsLoading } = useAuthStore();

	const queryClient = useQueryClient();
	const { token, userId } = getAuthCookies();

	// 사용자 정보를 가져오는 비동기 함수
	const fetchUser = async (): Promise<User | null> => {
		const { token, userId } = getAuthCookies();

		if (!token || !userId) {
			return null;
		}

		const res = await fetch(API_ENDPOINTS.AUTH.USER(userId), {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) throw new Error('Failed to fetch user');
		const data = await res.json();
		return data;

		// const subscriptionRes = await fetch(API_ENDPOINTS.SUBSCRIBERS.STATUS(userId), {
		// 	method: 'GET',
		// 	credentials: 'include',
		// 	headers: { 'Content-Type': 'application/json' },
		// });

		// if (!subscriptionRes.ok) throw new Error('Failed to fetch subscription status');
		// const subscriptionData = await subscriptionRes.json();

		// return {
		// 	...userData,
		// 	isSubscribed:
		// 		subscriptionData.status === 'active' ? true : subscriptionData.status === 'paused' ? false : null,
		// };
	};

	// `useQuery`를 활용하여 자동으로 사용자 정보 가져오기 (토큰이 존재하는 경우 실행)
	const {
		data: userData,
		status: userStatus,
		error: userError,
		isLoading: userIsLoading,
	} = useQuery<User | null>({
		queryKey: ['user'],
		queryFn: fetchUser,
		enabled: Boolean(token && userId),
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});

	// 페이지 새로고침 후 로그인 유지 (사용자 정보 설정)
	useEffect(() => {
		if (userStatus === 'success' && userData) {
			setUser(userData);
			setIsLoading(false);
		} else if (userStatus === 'error' || userError) {
			setUser(null);
			setIsLoading(false);
		}
	}, [userStatus, userData, setUser, userError, setIsLoading]);

	// 로그인 핸들러 (Google OAuth)
	const handleLogin = async () => {
		window.open(API_ENDPOINTS.AUTH.LOGIN, '_blank', `width=${POPUP.WIDTH}, height=${POPUP.HEIGHT}`);

		window.addEventListener('message', async (event) => {
			if (event.origin !== API_URL) return;
			if (event.data?.type === 'oauthSuccess') {
				const { token, user } = event.data;

				// 쿠키 저장 (`access_token` & `userId`)
				setCookie(TOKEN.ACCESS, token, TOKEN.AGE);
				setCookie(TOKEN.USER_ID, String(user.id), TOKEN.AGE);
				// Zustand 상태 업데이트
				setUser(user);

				queryClient.invalidateQueries({ queryKey: ['user'] });
				queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
			}
		});
	};

	// 로그아웃 핸들러
	const handleLogout = async () => {
		// 쿠키 삭제
		deleteCookie(TOKEN.ACCESS);
		deleteCookie(TOKEN.USER_ID);

		// Zustand 상태 초기화
		setUser(null);
		setIsLoading(false);

		await queryClient.invalidateQueries({ queryKey: ['user'] });
		await queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });

		// 보호된 경로 리디렉션
		const protectedRoutes = ['/mypage'];
		if (protectedRoutes.includes(window.location.pathname)) {
			window.location.href = '/';
		}
	};

	return {
		user,
		isLoading: isLoading && userIsLoading && userStatus === 'pending',
		handleLogin,
		handleLogout,
		refetchUser: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
	};
};
