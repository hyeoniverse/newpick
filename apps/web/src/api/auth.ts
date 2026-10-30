import { User } from '@/models/user.model';
import { API_ENDPOINTS } from '@/constants/api';
import { fetchSubscription } from '@/api/subscription';
import { fetchInterests } from '@/api/interests';
import { mapTitleToId } from '@/utils/mapInterests';
import { apiFetch } from '@/api/client';
import { isEmbedded, LoginPopupResult, openLoginPopup } from '@/utils/loginPopup';

/**
 * 로그인: /api/auth/google로 이동하면 백엔드가 Google OAuth로 리다이렉트합니다.
 * 다른 사이트 안(iframe)이면 구글 화면이 뜨지 않으므로 팝업으로 열고 결과를 돌려줍니다 (utils/loginPopup.ts)
 */
export const loginUser = async (): Promise<LoginPopupResult | void> => {
	if (isEmbedded()) return openLoginPopup();
	window.location.href = API_ENDPOINTS.AUTH.LOGIN();
};

// 추가 사용자 데이터 불러오기 (구독 상태, 관심사)
export const fetchAdditionalUserData = async (user: User): Promise<User> => {
	try {
		const [subscription, interests] = await Promise.all([fetchSubscription(), fetchInterests()]);
		return {
			...user,
			isSubscribed: subscription,
			interests: mapTitleToId(interests),
		};
	} catch {
		return user;
	}
};

// 사용자 정보 조회 API (브라우저). 401이면 apiFetch가 토큰 갱신 후 한 번 다시 시도합니다.
export const fetchUser = async (): Promise<User> => {
	const userData = await apiFetch<User>(API_ENDPOINTS.MY.PROFILE());
	return fetchAdditionalUserData(userData);
};

// 회원 탈퇴: 회원 정보와 관심 분야·구독·북마크·발송 기록을 지우고 로그인 쿠키도 지운다 (#65)
export const deleteAccount = async (): Promise<void> => {
	await apiFetch(API_ENDPOINTS.MY.ACCOUNT(), { method: 'DELETE' });
};

// 로그아웃 API
export const logoutUser = async (): Promise<void> => {
	await apiFetch(API_ENDPOINTS.AUTH.LOGOUT(), { method: 'POST', retryOnUnauthorized: false });
};

/** 로그인한 기기 한 대 (current: 지금 이 브라우저) */
export interface LoginSession {
	id: number;
	userAgent: string | null;
	createdAt: string;
	lastUsedAt: string;
	current: boolean;
}

export const fetchSessions = () => apiFetch<LoginSession[]>(API_ENDPOINTS.AUTH.SESSIONS());

export const logoutSession = async (id: number): Promise<void> => {
	await apiFetch(API_ENDPOINTS.AUTH.SESSION(id), { method: 'DELETE' });
};

export const logoutOtherSessions = () =>
	apiFetch<{ removed: number }>(API_ENDPOINTS.AUTH.LOGOUT_OTHERS(), { method: 'POST' });

/** 이메일 바꾸기 1단계: 새 주소로 6자리 코드 */
export const sendEmailCode = (email: string) =>
	apiFetch<{ email: string; expiresAt: string; resendAfter: string }>(API_ENDPOINTS.MY.EMAIL_CODE(), {
		method: 'POST',
		body: { email },
	});

/** 이메일 바꾸기 2단계: 코드가 맞으면 바뀐 주소 */
export const verifyEmailCode = (code: string) =>
	apiFetch<{ email: string }>(API_ENDPOINTS.MY.EMAIL_VERIFY(), {
		method: 'POST',
		body: { code },
	});
