import { StatusCodes } from 'http-status-codes';
import { API_ENDPOINTS } from '@/constants/api';
import { mapIdToTitle, mapTitleToId } from '@/utils/mapInterests';

/**
 * 사용자의 관심사를 조회하는 API
 */
export const fetchInterests = async (): Promise<string[]> => {
	try {
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

		return mapIdToTitle(await response.json());
	} catch (error) {
		console.log('❌ 관심사 불러오기 실패:', error);
		throw error;
	}
};

/**
 * 사용자의 관심사를 업데이트하는 API
 */
export const updateInterests = async (interests: string[]): Promise<string[]> => {
	try {
		if (interests.length === 0) {
			throw new Error(`최소 한 개 이상의 관심사를 선택해야 합니다. ${StatusCodes.BAD_REQUEST}`);
		}

		const interestsId = mapTitleToId(interests).filter((id) => id !== 0);
		const response = await fetch(API_ENDPOINTS.SUBSCRIBERS.INTERESTS(), {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ interests: interestsId }),
		});

		if (!response.ok) {
			throw new Error(`관심사를 업데이트하는데 실패했습니다. ${response.status}`);
		}

		const result = await response.json();
		return mapIdToTitle(result?.interests ?? []); //변경 포인트 / 구독해지페이지 로그아웃 무한 루프 방지 (테스트용)
	} catch (error) {
		console.log('❌ 관심사 업데이트 실패:', error);
		throw error;
	}
};
