import { useEffect } from 'react';
import { User } from '@/models/user.model';
import { API_URL, API_ENDPOINTS } from '@/constants/api';
import { POPUP, TOKEN } from '@/constants/numbers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';

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
	const { data, isLoading, isError } = useQuery<User | null>({
		queryKey: ['user'],
		queryFn: fetchUser,
		enabled: !!getTokenFromCookies() && !!user?.id,
		staleTime: 1000 * 60 * 5, // 5분 동안 캐싱 유지
		retry: 1, // 실패 시 1회만 재시도
	});

	useEffect(() => {
		if (!isLoading) {
			if (data) {
				// 데이터가 있으면 로그인
				setUser(data);
			} else {
				// 데이터가 없으면 즉시 로그아웃
				setUser(null);
			}
		}
	}, [data, isLoading, setUser]);

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

		const protectedRoutes = ['/mypage'];
		if (protectedRoutes.includes(window.location.pathname)) {
			window.location.href = '/';
		}
	};

	return { user, isLoading, isError, handleLogin, handleLogout };
};
