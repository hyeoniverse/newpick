import API_ENDPOINTS from '@/constants/api';
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
