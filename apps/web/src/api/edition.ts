import { API_ENDPOINTS } from '@/constants/api';
import type { BreakingNotice, HomeToday } from '@newpick/shared';
import { ApiError, apiFetch } from '@/api/client';

export type EditionPreview = { date: string; subject: string; html: string };

/** 고른 분야로 받게 될 구독 메일 (#55). 그 분야 발행본이 아직 없으면 null */
export const fetchEditionPreview = async (categoryIds: number[]) => {
	try {
		const preview = await apiFetch<{ data: EditionPreview }>(API_ENDPOINTS.EDITION.PREVIEW(categoryIds));
		return preview.data;
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) return null;
		throw error;
	}
};

/** 홈 '오늘' 묶음 (서버에서, 홈 ISR과 함께 10분마다). 편집본이 아직 없으면 null */
export const fetchHomeToday = async () => {
	try {
		const today = await apiFetch<{ data: HomeToday }>(API_ENDPOINTS.EDITION.TODAY);
		return today.data;
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) return null;
		throw error;
	}
};

/** 홈 속보 띠: 나간 속보 가운데 가장 최근 것 (없으면 null). 브라우저에서 1분마다 부른다 */
export const fetchBreakingLatest = async () =>
	(await apiFetch<{ data: BreakingNotice | null }>(API_ENDPOINTS.NEWSLETTER.BREAKING_LATEST)).data;
