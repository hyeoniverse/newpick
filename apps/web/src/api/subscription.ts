import { API_ENDPOINTS } from '@/constants/api';

/**
 * 사용자의 구독 상태를 조회하는 API
 */
export const fetchSubscription = async (): Promise<boolean | null> => {
	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.STATUS()}`, {
		method: 'GET',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) {
		throw new Error(`구독 상태 조회에 실패했습니다. ${response.status}`);
	}

	const data = await response.json();
	const status = data.status === 'active' ? true : data.status === 'paused' ? false : null;

	return status;
};

/**
 * 구독 시작 요청 API
 */
export const startSubscription = async (): Promise<void> => {
	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.START(), {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) throw new Error(`구독 시작에 실패했습니다. ${response.status}`);

	return response.json();
};

/**
 * 구독 일시정지 요청 API
 */
export const pauseSubscription = async (): Promise<void> => {
	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.PAUSE(), {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) throw new Error(`구독 일시정지에 실패했습니다. ${response.status}`);

	return response.json();
};

/**
 * 구독 취소 요청 API
 */
export const cancelSubscription = async (): Promise<void> => {
	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.CANCEL(), {
		method: 'DELETE',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) throw new Error(`구독 취소에 실패했습니다. ${response.status}`);

	return response.json();
};

/**
 * 구독 기록 조회 API
 */
export const fetchSubscriptionHistory = async () => {
	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.HISTORY()}`, {
		method: 'GET',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 기록 조회 실패:', response.status, errorText);
		throw new Error(`구독 기록 조회 실패: ${errorText}`);
	}

	const data = await response.json();
	return data;
};
