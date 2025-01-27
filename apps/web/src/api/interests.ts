// src/api/interests.ts

import { API_ENDPOINTS } from '@/constants/api';

/**
 * 사용자의 관심사를 조회하는 API
 */
export const fetchInterests = async ({ token }: { token: string | null }) => {
	if (!token) throw new Error('유효한 토큰이 없습니다.');

	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.INTERESTS, {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`구독 관심사 조회 실패: ${errorText}`);
	}

	return response.json();
};

/**
 * 사용자의 관심사를 업데이트하는 API
 */
export const updateInterests = async ({ token, interests }: { token: string | null; interests: string[] }) => {
	if (!token || interests.length === 0) {
		throw new Error('유효한 토큰 또는 관심사가 없습니다.');
	}

	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.INTERESTS, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ interests }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`구독 관심사 수정 실패: ${errorText}`);
	}

	return response.json();
};
