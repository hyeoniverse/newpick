import { LOGIN } from '@/copy';
import { queryKeys } from '@/api/queryKeys';
import { useCallback, useEffect } from 'react';
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

import { User } from '@/types/user';
import { AUTH } from '@/constants/numbers';
import { isProtectedPath } from '@/constants/routes';
import { fetchUser, logoutUser } from '@/api/auth';
import { ApiError } from '@/api/client';

import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * 누구에게나 같은 조회 결과(뉴스레터 목록 · 본문 · 인기 · 키워드 · 트렌드). 로그아웃 · 탈퇴해도 남긴다.
 * 나머지는 모두 지운다: 계정별 키를 하나씩 적으면 새 키(팔로우 · 로그인 기록 …)가 빠져 전 계정 데이터가 보였다
 */
const PUBLIC_QUERY_ROOTS = new Set([
	'articleList',
	'articleContent',
	'popularArticles',
	'relatedNews',
	'popularKeywords',
	'allKeywords',
	'trends',
]);

/**
 * 프로필 조회 실패 가운데 로그인이 정말 끝난 경우: 토큰 갱신까지 실패(401)했거나 탈퇴한 계정.
 * 그 밖(api 재시작 중 · 5xx · 네트워크)은 다시 시도하고 로그인 상태를 지우지 않는다 (#340: 예전에는 잠깐의 장애에도
 * 로그아웃 상태로 굳어, 새로 고칠 때까지 로그인 버튼 · 401 화면이 보였다)
 */
export const endsSession = (error: unknown) =>
	error instanceof ApiError && (error.status === 401 || error.code === 'USER_NOT_FOUND');

/** 이 계정의 조회 결과를 모두 지운다 (공개 결과만 남김) */
export function clearAccountQueries(queryClient: QueryClient) {
	queryClient.removeQueries({ predicate: (query) => !PUBLIC_QUERY_ROOTS.has(String(query.queryKey[0])) });
}

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
		clearAccountQueries(queryClient);
		if (isProtectedPath(pathname)) {
			router.push('/');
		}
	}, [pathname, router, clearUser, queryClient]);

	// 로그아웃 핸들러
	const handleLogout = useCallback(async () => {
		try {
			await logoutUser();
			resetSession();
		} catch {
			showToast(LOGIN.logoutFailed, 'error');
		}
	}, [resetSession, showToast]);

	// `useQuery`를 활용하여 자동으로 사용자 정보 가져오기
	const {
		data: userData,
		status: userStatus,
		error: userError,
		refetch: refetchUser,
	} = useQuery<User | null>({
		queryKey: queryKeys.user,
		queryFn: fetchUser,
		// 로그인 표시 쿠키가 있을 때만 조회합니다. 비로그인 방문자는 백엔드를 호출하지 않습니다.
		enabled: session === 'in',
		staleTime: AUTH.STALE_TIME,
		// 로그인이 끝난 경우는 바로, 잠깐의 장애는 3번까지 다시 (간격은 React Query 기본: 1 · 2 · 4초)
		retry: (failureCount, error) => !endsSession(error) && failureCount < 3,
	});

	// OAuth 리다이렉트 후 사용자 정보 가져오기
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has('oauthSuccess')) {
			refetchUser();
			window.history.replaceState(null, '', '/');
		}
	}, [router, refetchUser]);

	// 조회 결과를 스토어에 반영합니다. 로그인이 끝난 실패(endsSession)일 때만 로그아웃 상태로 바꿉니다.
	useEffect(() => {
		if (userStatus === 'success' && userData) {
			setUser(userData);
		} else if (userStatus === 'error' && endsSession(userError)) {
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
