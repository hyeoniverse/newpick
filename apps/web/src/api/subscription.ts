import { API_ENDPOINTS } from '@/constants/api';
import { mapTitleToId } from '@/utils/mapInterests';
import type { BreakingMailSettings } from '@newpick/shared';
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
 * 구독 시작 요청 API. interests를 빼면(일시정지 → 다시 켜기) 서버가 지금 관심사를 그대로 둔다.
 * 빈 배열을 보내면 관심사가 모두 지워져 메일이 가지 않으므로 보내지 않는다
 */
export const startSubscription = async (interests?: string[]): Promise<void> => {
	const body = interests ? { interests: mapTitleToId(interests).filter((id) => id !== 0) } : {};
	await apiFetch(API_ENDPOINTS.SUBSCRIBERS.START(), { method: 'POST', body });
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

/** 맞춤 메일 (#123): 켜 두면 북마크 · 스크랩으로 그날 모든 분야에서 골라 보내고, 끄면 구독한 분야를 분야별로 */
export const fetchPersonalMail = () => apiFetch<{ enabled: boolean }>(API_ENDPOINTS.MY.PERSONAL_MAIL());

export const savePersonalMail = (enabled: boolean) =>
	apiFetch<{ enabled: boolean }>(API_ENDPOINTS.MY.PERSONAL_MAIL(), { method: 'PUT', body: { enabled } });

/** 속보 메일 설정: 받기 · 밤에도 바로 받기 */
export const fetchBreakingMail = () => apiFetch<BreakingMailSettings>(API_ENDPOINTS.MY.BREAKING_MAIL());

export const saveBreakingMail = (next: Partial<BreakingMailSettings>) =>
	apiFetch<BreakingMailSettings>(API_ENDPOINTS.MY.BREAKING_MAIL(), { method: 'PUT', body: next });

/** 메일의 '속보만 받지 않기' (로그인 없이 token으로): 누구인지 · 지금 받는지 · 끄기 */
export const fetchBreakingOffTarget = (token: string) =>
	apiFetch<{ data: { email: string; receiving: boolean } }>(API_ENDPOINTS.NEWSLETTER.BREAKING_OFF(token)).then(
		(r) => r.data,
	);
export const turnOffBreakingByToken = (token: string) =>
	apiFetch(API_ENDPOINTS.NEWSLETTER.BREAKING_OFF(token), { method: 'POST' });

/** 메일의 구독 해지 링크 (로그인 없이 token으로): 누구의 구독인지 · 해지하기 */
export const fetchUnsubscribeTarget = (token: string) =>
	apiFetch<{ data: { email: string; subscribed: boolean } }>(API_ENDPOINTS.SUBSCRIBERS.UNSUBSCRIBE(token)).then(
		(r) => r.data,
	);
export const unsubscribeByToken = (token: string) =>
	apiFetch(API_ENDPOINTS.SUBSCRIBERS.UNSUBSCRIBE(token), { method: 'POST' });
