import { useEffect } from 'react';
import { User } from '@/models/user.model';
import { API_URL, API_ENDPOINTS } from '@/constants/api';
import { POPUP, TOKEN } from '@/constants/numbers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSubscribe } from './useSubscribe';

// 쿠키에서 `access_token` 가져오는 함수
const getTokenFromCookies = (): string | null => {
	if (typeof window === 'undefined') return null;
	return (
		document.cookie
			.split('; ')
			.find((row) => row.startsWith(`${TOKEN.ACCESS}=`))
			?.split('=')[1] || null
	);
};

export const useAuth = () => {
	const { user, setUser } = useAuthStore();
	const { subscriptionStatus, isSubscriptionLoading } = useSubscribe();

	const queryClient = useQueryClient();

	// 사용자 정보를 가져오는 비동기 함수
	const fetchUser = async (): Promise<User> => {
		const token = getTokenFromCookies();
		if (!token) throw new Error('No token found');
		if (!user?.id) {
			throw new Error('User ID is missing');
		}

		const res = await fetch(API_ENDPOINTS.AUTH.USER(user.id), {
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
	const {
		data: userData,
		isLoading: isUserLoading,
		isError,
		// refetch: refetchUser,
	} = useQuery<User | null>({
		queryKey: ['user'],
		queryFn: fetchUser,
		enabled: !!getTokenFromCookies() && !!user?.id,
		staleTime: 1000 * 60 * 5, // 5분 동안 캐싱 유지
		retry: 1, // 실패 시 1회만 재시도
	});

	useEffect(() => {
		if (!isUserLoading) {
			if (userData) {
				// 데이터가 있으면 로그인
				setUser(userData);
			} else {
				// 데이터가 없으면 즉시 로그아웃
				setUser(null);
			}
		}
	}, [userData, isUserLoading, setUser]);

	// Zustand 상태 업데이트 (이전 상태와 비교 후 변경)
	useEffect(() => {
		if (!isSubscriptionLoading && subscriptionStatus !== undefined) {
			if (user && user.isSubscribed !== subscriptionStatus) {
				setUser({ ...user, isSubscribed: subscriptionStatus });
			}
		}
	}, [isSubscriptionLoading, subscriptionStatus, setUser, user]);

	// 로그인 핸들러 (Google OAuth)
	const handleLogin = async () => {
		window.open(API_ENDPOINTS.AUTH.LOGIN, '_blank', `width=${POPUP.WIDTH}, height=${POPUP.HEIGHT}`);

		window.addEventListener('message', async (event) => {
			if (event.origin !== API_URL) return;
			if (event.data?.type === 'oauthSuccess') {
				const { token, user } = event.data;

				// 쿠키 저장
				document.cookie = `access_token=${token}; Path=/; Secure; SameSite=Strict; Max-Age=${TOKEN.AGE}`;

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
		document.cookie = 'access_token=; Path=/; Max-Age=0';

		// Zustand 상태 초기화
		setUser(null);
		await queryClient.invalidateQueries({ queryKey: ['user'] });
		await queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });

		const protectedRoutes = ['/mypage'];
		if (protectedRoutes.includes(window.location.pathname)) {
			window.location.href = '/';
		}
	};

	useEffect(() => {
		console.log('user', user);
	}, [user]);

	return { user, isLoading: isUserLoading, isError, handleLogin, handleLogout };
};
