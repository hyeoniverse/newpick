import API_ENDPOINTS from '@/constants/api';
import { IBookmarkItem } from '@/models/bookmark.model';
import { ApiError, apiFetch } from '@/api/client';

export async function fetchUserBookmarksApi(): Promise<IBookmarkItem[]> {
	try {
		return await apiFetch<IBookmarkItem[]>(API_ENDPOINTS.MY.BOOKMARKS());
	} catch (error) {
		// 북마크가 없으면 서버가 404를 돌려줍니다.
		if (error instanceof ApiError && error.status === 404) return [];
		throw error;
	}
}

export async function addBookmarkApi(newsId: number, newsletterId: number): Promise<IBookmarkItem> {
	return apiFetch<IBookmarkItem>(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
		method: 'POST',
		body: { newsId, newsletterId },
	});
}

export async function removeBookmarkApi(newsId: number, newsletterId: number): Promise<{ success: boolean }> {
	return apiFetch<{ success: boolean }>(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
		method: 'DELETE',
		body: { newsId, newsletterId },
	});
}
