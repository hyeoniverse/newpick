import API_ENDPOINTS from '@/constants/api';
import { IBookmarkItem } from '@/models/bookmark.model';

export async function fetchUserBookmarksApi(): Promise<IBookmarkItem[]> {
	try {
		const response = await fetch(API_ENDPOINTS.MY.BOOKMARKS(), {
			method: 'GET',
			credentials: 'include',
		});

		// 북마크가 없을 경우
		if (response.status === 404) {
			return [];
		}

		if (!response.ok) {
			throw new Error('북마크 목록을 불러오는 데 실패했습니다.');
		}
		return response.json();
	} catch (error) {
		console.error('북마크 목록 조회 에러:', error);
		throw error;
	}
}

export async function addBookmarkApi(newsId: number, newsletterId: number): Promise<IBookmarkItem> {
	try {
		const response = await fetch(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ newsId, newsletterId }),
		});
		if (!response.ok) {
			throw new Error('북마크를 추가하는데 실패했습니다.');
		}
		return response.json();
	} catch (error) {
		console.error('북마크 추가 에러: ', error);
		throw error;
	}
}

export async function removeBookmarkApi(newsId: number, newsletterId: number): Promise<{ success: boolean }> {
	try {
		const response = await fetch(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
			method: 'DELETE',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ newsId, newsletterId }),
		});
		if (!response.ok) {
			throw new Error('북마크를 삭제하는데 실패했습니다.');
		}
		return response.json();
	} catch (error) {
		console.error('북마크 삭제 에러: ', error);
		throw error;
	}
}
