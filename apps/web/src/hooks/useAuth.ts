import { useEffect, useState } from 'react';
import { User } from '@/models/user.model';
import { API_URL, TOKEN, API_ENDPOINTS } from '@/constants/api';
import { POPUP } from '@/constants/numbers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSubscribe } from './useSubscribe';

// 클라이언트에서만 쿠키 값을 가져오도록 `useEffect` 사용
const getCookieValue = (name: string): string | null => {
	if (typeof document === 'undefined') return null;
	return (
		document.cookie
			.split('; ')
			.find((row) => row.startsWith(`${name}=`))
			?.split('=')[1] || null
	);
};

// 쿠키에 `access_token`과 `userId` 저장하는 함수
const setCookie = (name: string, value: string, maxAge: number) => {
	document.cookie = `${name}=${value}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
};

// 쿠키에서 `access_token`과 `userId` 삭제하는 함수
const deleteCookie = (name: string) => {
	document.cookie = `${name}=; Path=/; Max-Age=0`;
};

export const useAuth = () => {
	const { user, setUser, isLoading, setIsLoading } = useAuthStore();
	const {} = useSubscribe();
	const queryClient = useQueryClient();
	const [token, setToken] = useState<string | null>(null);
	const [userId, setUserId] = useState<number | null>(null);

	// 클라이언트에서만 쿠키 값을 가져오기
	useEffect(() => {
		if (typeof window !== 'undefined') {
			setToken(getCookieValue(TOKEN.ACCESS));
			const userId = getCookieValue(TOKEN.USER_ID);
			const parsedUserId = userId ? parseInt(userId, 10) : null;
			setUserId(parsedUserId);
		}
	}, []);

	// 사용자 정보를 가져오는 비동기 함수
	const fetchUser = async (): Promise<User> => {
		if (!token || !userId) throw new Error('No token or userId found');

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

		// `isSubscribed` 정보 추가 후 반환
		return { ...userData, isSubscribed: subscriptionData.active };
	};

	// `useQuery`를 활용하여 자동으로 사용자 정보 가져오기 (토큰이 존재하는 경우 실행)
	const { data: userData, status: userStatus } = useQuery<User | null>({
		queryKey: ['user'],
		queryFn: fetchUser,
		enabled: !!token && !!userId, // 클라이언트에서만 실행하도록 수정
		staleTime: 1000 * 60 * 5,
		retry: 1, // 실패 시 1회만 재시도
	});

	// 페이지 새로고침 후 로그인 유지 (사용자 정보 설정)
	useEffect(() => {
		if (userStatus === 'success' && userData && JSON.stringify(user) !== JSON.stringify(userData)) {
			setUser(userData);
		} else if (userStatus === 'error') {
			setUser(null);
		}
	}, [userStatus, userData, setUser, user]);

	// 로딩 상태
	useEffect(() => {
		if (userStatus === 'pending' && !isLoading) {
			setIsLoading(true);
		} else if (userStatus !== 'pending' && isLoading) {
			setIsLoading(false);
		}
	}, [userStatus, setIsLoading, isLoading]);

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

		await queryClient.invalidateQueries({ queryKey: ['user'] });
		await queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });

		// 보호된 경로 리디렉션
		const protectedRoutes = ['/mypage'];
		if (protectedRoutes.includes(window.location.pathname)) {
			window.location.href = '/';
		}
	};

	useEffect(() => {
		console.log('user', user);
	}, [user]);

	return { user, isLoading, handleLogin, handleLogout };
};
