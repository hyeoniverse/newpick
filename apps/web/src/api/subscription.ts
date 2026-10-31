import { API_ENDPOINTS } from '@/constants/api';
import { mapTitleToId } from '@/utils/mapInterests';
import { apiFetch } from '@/api/client';

type SubscriptionStatus = { active: boolean; status: 'active' | 'paused' | 'cancelled' | 'none' };

/** active → true, paused → false, 그 외 → null */
export const toIsSubscribed = (status?: SubscriptionStatus['status']): boolean | null =>
	status === 'active' ? true : status === 'paused' ? false : null;

/**
 * 사용자의 구독 상태를 조회하는 API. 실패하면 null(알 수 없음)을 돌려줍니다.
 */
export const fetchSubscription = async (): Promise<boolean | null> => {
	try {
		const data = await apiFetch<SubscriptionStatus>(API_ENDPOINTS.SUBSCRIBERS.STATUS());
		return toIsSubscribed(data.status);
	} catch {
		return null;
	}
};

/**
 * 구독 시작 요청 API
 */
export const startSubscription = async (interests: string[]): Promise<void> => {
	const interestsId = mapTitleToId(interests).filter((id) => id !== 0);
	await apiFetch(API_ENDPOINTS.SUBSCRIBERS.START(), { method: 'POST', body: { interests: interestsId } });
};

/**
 * 구독 일시정지 요청 API
 */
export const pauseSubscription = async (): Promise<void> => {
	await apiFetch(API_ENDPOINTS.SUBSCRIBERS.PAUSE(), { method: 'POST' });
};

/**
 * 구독 취소 요청 API
 */
export const cancelSubscription = async (): Promise<void> => {
	await apiFetch(API_ENDPOINTS.SUBSCRIBERS.CANCEL(), { method: 'DELETE' });
};

/**
 * 구독 기록 조회 API
 */
export const fetchSubscriptionHistory = async () => apiFetch(API_ENDPOINTS.SUBSCRIBERS.HISTORY());

/** 맞춤 메일 (#123): 켜 두면 북마크 · 스크랩으로 그날 모든 분야에서 골라 보내고, 끄면 구독한 분야를 분야별로 */
export const fetchPersonalMail = () => apiFetch<{ enabled: boolean }>(API_ENDPOINTS.MY.PERSONAL_MAIL());

export const savePersonalMail = (enabled: boolean) =>
	apiFetch<{ enabled: boolean }>(API_ENDPOINTS.MY.PERSONAL_MAIL(), { method: 'PUT', body: { enabled } });
