import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

import { User } from '@/models/user.model';
import { AUTH } from '@/constants/numbers';
import { PROTECTED } from '@/constants/api';
import { fetchUser, logoutUser } from '@/api/auth';

import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/useAuthStore';

/** 로그인한 사람마다 다른 조회 결과. 로그아웃·탈퇴하면 지운다 */
const USER_QUERY_KEYS = ['user', 'bookmarks', 'highlights', 'taste', 'subscriptionStatus', 'subscriptionInterests'];

export const useAuth = () => {
	const { showToast } = useToast();
	const { user, session, setUser, clearUser } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();
	const queryClient = useQueryClient();

	/**
	 * 로그아웃·탈퇴 뒤 공통: 로그인 상태와 이 계정의 조회 결과(북마크·구독 상태·관심 분야)를 지우고,
	 * 로그인이 필요한 화면이면 홈으로
	 */
	const resetSession = useCallback(() => {
		clearUser();
		for (const key of USER_QUERY_KEYS) queryClient.removeQueries({ queryKey: [key] });
		if (PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
			router.push('/');
		}
	}, [pathname, router, clearUser, queryClient]);

	// 로그아웃 핸들러
	const handleLogout = useCallback(async () => {
		try {
			await logoutUser();
			resetSession();
		} catch {
			showToast('로그아웃 중 오류가 발생했습니다.', 'error');
		}
	}, [resetSession, showToast]);

	// `useQuery`를 활용하여 자동으로 사용자 정보 가져오기
	const {
		data: userData,
		status: userStatus,
		error: userError,
		refetch: refetchUser,
	} = useQuery<User | null>({
		queryKey: ['user'],
		queryFn: fetchUser,
		// 로그인 표시 쿠키가 있을 때만 조회합니다. 비로그인 방문자는 백엔드를 호출하지 않습니다.
		enabled: session === 'in',
		staleTime: AUTH.STALE_TIME,
		retry: 1,
	});

	// OAuth 리다이렉트 후 사용자 정보 가져오기
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has('oauthSuccess')) {
			refetchUser();
			window.history.replaceState(null, '', '/');
		}
	}, [router, refetchUser]);

	// 조회 결과를 스토어에 반영합니다. 실패하면(토큰 갱신까지 실패) 로그아웃 상태로 바꿉니다.
	useEffect(() => {
		if (userStatus === 'success' && userData) {
			setUser(userData);
		} else if (userStatus === 'error' || userError) {
			clearUser();
		}
	}, [userStatus, userData, setUser, userError, clearUser]);

	return {
		user,
		session,
		refetchUser,
		handleLogout,
		resetSession,
	};
};
