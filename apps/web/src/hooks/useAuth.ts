import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

import { User } from '@/models/user.model';
import { AUTH } from '@/constants/numbers';
import { PROTECTED } from '@/constants/api';
import { fetchUserWithRefresh, loginUser, logoutUser } from '@/api/auth';

import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/useAuthStore';

export const useAuth = () => {
	const { showToast } = useToast();
	const { user, setUser, clearUser, isLoading } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();

	// 로그인 핸들러 (Google OAuth)
	const handleLogin = async () => {
		try {
			const user = await loginUser(setUser);
			setUser(user);
		} catch (error) {
			console.error('❌ 로그인 실패:', error);
		}
	};

	// 로그아웃 핸들러
	const handleLogout = useCallback(async () => {
		try {
			await logoutUser();
			// Zustand 상태 초기화
			clearUser();
			// 보호된 경로 리디렉션
			if (PROTECTED.includes(pathname)) {
				router.push('/');
			}
		} catch (error) {
			console.error('❌ 로그아웃 오류:', error);
			showToast('로그아웃 중 오류가 발생했습니다.', 'error');
		}
	}, [pathname, router, clearUser, showToast]);

	// `useQuery`를 활용하여 자동으로 사용자 정보 가져오기
	const {
		data: userData,
		status: userStatus,
		error: userError,
		isLoading: userIsLoading,
		refetch: refetchUser,
	} = useQuery<User | null>({
		queryKey: ['user'],
		queryFn: fetchUserWithRefresh,
		enabled: true,
		staleTime: AUTH.STALE_TIME,
		retry: 1,
	});

	// 페이지 새로고침 후 로그인 유지 (사용자 정보 설정)
	useEffect(() => {
		if (userStatus === 'success' && userData) {
			setUser(userData);
		} else if (userStatus === 'error' || userError) {
			clearUser();
		}
	}, [userStatus, userData, setUser, userError, clearUser]);

	return {
		user,
		refetchUser,
		isLoading: isLoading && userIsLoading && userStatus === 'pending',
		handleLogin,
		handleLogout,
	};
};
