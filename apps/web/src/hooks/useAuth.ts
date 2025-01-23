import { useEffect, useState } from 'react';
import { User } from '@/models/user.model';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { API_ENDPOINTS } from '@/constants/api';

export const useAuth = () => {
	const { user, login, logout, isAuthenticated } = useAuthStore();
	const [isLoaded, setIsLoaded] = useState<boolean>(true);

	// 쿠키에서 `access_token` 가져오는 함수 (memoization 적용)
	const getTokenFromCookies = (): string | null => {
		const token = document.cookie
			.split('; ')
			.find((row) => row.startsWith('access_token='))
			?.split('=')[1];

		return token || null;
	};

	// 사용자 정보를 가져오는 비동기 함수
	const fetchUser = async (): Promise<User> => {
		const token = getTokenFromCookies();
		if (!token) throw new Error('No token found');

		const res = await fetch(API_ENDPOINTS.AUTH.USER, {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) throw new Error('Failed to fetch user');
		return res.json();
	};

	// `useQuery`를 활용한 자동 데이터 패칭 (토큰이 존재하는 경우 실행)
	const { data, isError, isLoading, refetch } = useQuery<User, Error>({
		queryKey: ['user'],
		queryFn: fetchUser,
		enabled: !!getTokenFromCookies(),
		staleTime: 1000 * 60 * 5, // 5분 동안 캐싱 유지
		retry: 1, // 실패 시 1회만 재시도
	});

	useEffect(() => {
		if (!isLoading) {
			if (data) {
				// 데이터가 있으면 로그인
				login(data);
			} else {
				// 데이터가 없으면 즉시 로그아웃
				logout();
			}
		}
	}, [data, isLoading, login, logout]);

	useEffect(() => {
		if (user && !isLoading) {
			setIsLoaded(true);
		} else {
			setIsLoaded(false);
		}
	}, [user, isLoading]);

	useEffect(() => {
		console.log('user', user, 'isAuthenticated', isAuthenticated, 'isLoaded', isLoaded, 'isLoading', isLoading);
	}, [user, isAuthenticated, isError, isLoaded, isLoading]);

	// 로그인 핸들러 (Google OAuth)
	const handleLogin = async () => {
		window.open(API_ENDPOINTS.AUTH.LOGIN, '_blank', 'width=500,height=600');

		window.addEventListener('message', async (event) => {
			if (event.origin !== 'http://localhost:3001') return;
			if (event.data?.type === 'oauthSuccess') {
				const { token } = event.data;

				// 쿠키 저장
				document.cookie = `access_token=${token}; Path=/; Secure; SameSite=Strict; Max-Age=3600`;

				// Zustand 상태 즉시 업데이트
				await refetch();
			}
		});
	};

	// 로그아웃 핸들러
	const handleLogout = async () => {
		window.open('https://accounts.google.com/logout', '_blank');

		// 쿠키 삭제
		document.cookie = 'access_token=; Path=/; Max-Age=0';

		// Zustand 상태 초기화
		logout();

		// 페이지 새로고침 (로그인 상태 초기화)
		window.location.href = '/';
	};

	return { user, isAuthenticated, isError, isLoaded, handleLogin, handleLogout };
};
