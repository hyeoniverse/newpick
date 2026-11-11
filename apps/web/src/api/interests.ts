import { API_ENDPOINTS } from '@/constants/api';
import { mapIdToTitle, mapTitleToId } from '@/utils/mapInterests';
import { apiFetch } from '@/api/client';

/**
 * 사용자의 관심사를 조회하는 API
 */
export const fetchInterests = async (): Promise<string[]> =>
	mapIdToTitle(await apiFetch<number[]>(API_ENDPOINTS.SUBSCRIBERS.INTERESTS()));

/**
 * 사용자의 관심사를 업데이트하는 API
 */
export const updateInterests = async (interests: string[]): Promise<string[]> => {
	if (interests.length === 0) {
		throw new Error('관심사를 한 개 이상 선택해 주십시오.');
	}
	const interestsId = mapTitleToId(interests).filter((id) => id !== 0);
	const result = await apiFetch<{ interests: number[] }>(API_ENDPOINTS.SUBSCRIBERS.INTERESTS(), {
		method: 'PUT',
		body: { interests: interestsId },
	});
	return mapIdToTitle(result?.interests ?? []);
};
