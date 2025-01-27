import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

import { User } from '@/models/user.model';
import { API_URL, API_ENDPOINTS } from '@/constants/api';
import { AUTH, POPUP } from '@/constants/numbers';
import { useCookie } from '@/hooks/useCookie';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchUser } from '@/api/auth';

export const useAuth = () => {
	const { getAuthCookies } = useCookie();
	const { user, setUser, isLoading, setIsLoading } = useAuthStore();

	const queryClient = useQueryClient();
	const { token, userId } = getAuthCookies();

	const router = useRouter();
	const pathname = usePathname();

	// 로그인 핸들러 (Google OAuth)
	const handleLogin = async () => {
		window.open(API_ENDPOINTS.AUTH.LOGIN, '_blank', `width=${POPUP.WIDTH}, height=${POPUP.HEIGHT}`);

		window.addEventListener('message', async (event) => {
			if (event.origin !== API_URL) return;
			if (event.data?.type === 'oauthSuccess') {
				const { user } = event.data;

				if (!user || !user.id) {
					console.error('OAuth login response is missing user data:', event.data);
					return;
				}

				// Zustand 상태 업데이트
				setUser(user);
				queryClient.invalidateQueries({ queryKey: ['user'] });
				queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
			}
		});
	};

	// 로그아웃 핸들러
	const handleLogout = useCallback(async () => {
		try {
			// 백엔드 로그아웃 API 호출
			const res = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
			});

			if (!res.ok) {
				throw new Error('Failed to logout from server');
			}

			// Zustand 상태 초기화
			setUser(null);
			// React Query 캐시 무효화
			await queryClient.invalidateQueries({ queryKey: ['user'] });
			await queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });

			// 보호된 경로 리디렉션
			const protectedRoutes = ['/mypage'];
			if (protectedRoutes.includes(pathname)) {
				router.push('/');
			}
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}, [pathname, queryClient, router, setUser]);

	// `useQuery`를 활용하여 자동으로 사용자 정보 가져오기 (토큰이 존재하는 경우 실행)
	const {
		data: userData,
		status: userStatus,
		error: userError,
		isLoading: userIsLoading,
	} = useQuery<User | null>({
		queryKey: ['user'],
		queryFn: () => fetchUser(token as string, userId as number),
		enabled: true, // 토큰이 없어도 실행
		staleTime: AUTH.STALE_TIME,
		retry: 1,
	});

	// 페이지 새로고침 후 로그인 유지 (사용자 정보 설정)
	useEffect(() => {
		if (userStatus === 'success' && userData) {
			setUser(userData);
		} else if (userStatus === 'error' || userError) {
			setUser(null);
		}
	}, [userStatus, userData, setUser, userError, setIsLoading]);

	// 주기적으로 토큰 만료 확인
	useEffect(() => {
		const interval = setInterval(() => {
			if (!token && !userId && user) {
				setUser(null);
				alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
			}
		}, AUTH.TOKEN.INTERVAL); // 1분마다 실행

		return () => clearInterval(interval);
	}, [token, userId, setUser, user]);

	return {
		user,
		isLoading: isLoading && userIsLoading && userStatus === 'pending',
		handleLogin,
		handleLogout,
		refetchUser: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
	};
};
