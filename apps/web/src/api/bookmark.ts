import type { BookmarkPage } from '@newpick/shared';
import API_ENDPOINTS from '@/constants/api';
import { IBookmarkItem } from '@/types/bookmark';
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

/** 북마크 한 쪽. filters: 'folder=none&categoryId=3&sort=views' 같은 쿼리 */
export const fetchBookmarkPage = (offset: number, limit: number, filters = '') =>
	apiFetch<BookmarkPage>(
		API_ENDPOINTS.MY.BOOKMARKS_PAGE(`offset=${offset}&limit=${limit}${filters ? `&${filters}` : ''}`),
	);
/** 북마크 수만 (한 개짜리 쪽) */
export const fetchBookmarkCount = () =>
	apiFetch<{ counts: { all: number } }>(API_ENDPOINTS.MY.BOOKMARKS_PAGE('limit=1'));
/** 북마크를 폴더로 옮기기 (folderId null이면 폴더 없음) */
export const moveBookmarks = (newsletterIds: number[], folderId: number | null) =>
	apiFetch<{ count: number }>(API_ENDPOINTS.MY.BOOKMARKS_MOVE(), { method: 'POST', body: { newsletterIds, folderId } });
