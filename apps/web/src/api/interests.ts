import { StatusCodes } from 'http-status-codes';
import { API_ENDPOINTS } from '@/constants/api';

/**
 * 사용자의 관심사를 조회하는 API
 */
export const fetchInterests = async (): Promise<string[]> => {
	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.INTERESTS(), {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`관심사를 불러오는데 실패했습니다. ${response.status}`);
	}

	return response.json();
};

/**
 * 사용자의 관심사를 업데이트하는 API
 */
export const updateInterests = async (interests: string[]): Promise<string[]> => {
	if (interests.length === 0) {
		throw new Error(`최소 한 개 이상의 관심사를 선택해야 합니다. ${StatusCodes.BAD_REQUEST}`);
	}

	const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.INTERESTS(), {
		method: 'PATCH',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ interests }),
	});

	if (!response.ok) {
		throw new Error(`관심사를 업데이트하는데 실패했습니다. ${response.status}`);
	}

	return response.json();
};
