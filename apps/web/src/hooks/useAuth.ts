import { useEffect, useState } from 'react';
import { User } from '@/models/user.model';
import { API_URL, TOKEN, API_ENDPOINTS } from '@/constants/api';
import { POPUP } from '@/constants/numbers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';

// 쿠키 값을 가져오는 함수
const getCookieValue = (name: string): string | null => {
	if (typeof document === 'undefined') return null;
	return (
		document.cookie
			.split('; ')
			.find((row) => row.startsWith(`${name}=`))
			?.split('=')[1] || null
	);
};

// 쿠키 설정 함수
const setCookie = (name: string, value: string, maxAge: number) => {
	document.cookie = `${name}=${value}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
};

// 쿠키 삭제 함수
const deleteCookie = (name: string) => {
	document.cookie = `${name}=; Path=/; Max-Age=0`;
};

export const useAuth = () => {
	const { user, setUser, isLoading, setIsLoading } = useAuthStore();
	// const {} = useSubscribe();
	const queryClient = useQueryClient();
	const [token, setToken] = useState<string | null>(null);
	const [userId, setUserId] = useState<number | null>(null);

	// 클라이언트에서만 쿠키 값을 가져오기
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const storedToken = getCookieValue(TOKEN.ACCESS);
			const storedUserId = getCookieValue(TOKEN.USER_ID);
			const parsedUserId = storedUserId ? parseInt(storedUserId, 10) : null;

			if (storedToken && parsedUserId) {
				setToken(storedToken);
				setUserId(parsedUserId);
				setIsLoading(true);
			} else {
				setUser(null);
				setToken(null);
				setUserId(null);
				setIsLoading(false);
			}
		}
	}, [setIsLoading, setUser]);

	// 사용자 정보를 가져오는 비동기 함수
	const fetchUser = async (): Promise<User | null> => {
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
		const userData = await res.json();

		const subscriptionRes = await fetch(API_ENDPOINTS.SUBSCRIBERS.STATUS(userId), {
			method: 'GET',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!subscriptionRes.ok) throw new Error('Failed to fetch subscription status');
		const subscriptionData = await subscriptionRes.json();

		return {
			...userData,
			isSubscribed:
				subscriptionData.status === 'active' ? true : subscriptionData.status === 'paused' ? false : null,
		};
	};

	// `useQuery`를 활용하여 자동으로 사용자 정보 가져오기 (토큰이 존재하는 경우 실행)
	const {
		data: userData,
		status: userStatus,
		error: userError,
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
				setToken(token);
				setUserId(user.id);

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
		setToken(null);
		setUserId(null);
		setIsLoading(false);

		await queryClient.invalidateQueries({ queryKey: ['user'] });
		await queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });

		// 보호된 경로 리디렉션
		const protectedRoutes = ['/mypage'];
		if (protectedRoutes.includes(window.location.pathname)) {
			window.location.href = '/';
		}
	};

	return { user, isLoading, handleLogin, handleLogout };
};
