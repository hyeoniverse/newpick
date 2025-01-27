// src/api/subscription.ts

import { API_ENDPOINTS } from '@/constants/api';

/**
 * 사용자의 구독 상태를 조회하는 API
 */
export const fetchSubscription = async ({ userId }: { userId: number | undefined }) => {
	if (!userId) throw new Error('사용자 ID가 없습니다.');

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.STATUS(userId)}`, {
		method: 'GET',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`구독 상태 조회 실패: ${errorText}`);
	}

	const data = await response.json();
	return data.status;
};

/**
 * 구독 시작 요청 API
 */
export const startSubscription = async ({ userId }: { userId: number }) => {
	if (!userId) throw new Error('사용자 ID가 없습니다.');

	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.START, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`구독 요청 실패: ${errorText}`);
	}

	return response.json();
};

/**
 * 구독 일시정지 요청 API
 */
export const pauseSubscription = async ({ userId }: { userId: number }) => {
	if (!userId) throw new Error('사용자 ID가 없습니다.');

	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.PAUSE, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`구독 일시정지 실패: ${errorText}`);
	}

	return response.json();
};

/**
 * 구독 취소 요청 API
 */
export const cancelSubscription = async ({ userId }: { userId: number }) => {
	if (!userId) throw new Error('사용자 ID가 없습니다.');

	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.CANCEL, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`구독 취소 실패: ${errorText}`);
	}

	return response.json();
};

/**
 * 구독 기록 조회 API
 */
export const fetchSubscriptionHistory = async ({ queryKey }: { queryKey: [string, number | undefined] }) => {
	const [, userId] = queryKey; // queryKey에서 userId를 추출

	if (!userId) {
		throw new Error('사용자 ID가 없습니다.');
	}

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.HISTORY(userId)}`, {
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
