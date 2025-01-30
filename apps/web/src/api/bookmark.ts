// api/bookmark.ts
import API_ENDPOINTS from '@/constants/api';
import { IBookmarkItem } from '@/models/bookmark.model';

export async function fetchUserBookmarksApi(): Promise<IBookmarkItem[]> {
  try {
    const response = await fetch(API_ENDPOINTS.MYPAGE.BOOKMARKS, {
      method: 'GET',
      credentials: 'include', // 쿠키 포함
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('북마크 목록을 불러오는 데 실패했습니다.');
    }

    return response.json();
  } catch (error) {
    console.error('북마크 목록 조회 에러:', error);
    throw error;
  }
}

export async function addBookmarkApi(token: string, newsId: number): Promise<IBookmarkItem> {
  const response = await fetch(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newsId }),
  });
  if (!response.ok) {
    throw new Error('북마크를 추가하는데 실패했습니다.');
  }
  return response.json();
}

export async function removeBookmarkApi(token: string, newsId: number): Promise<{ success: boolean }> {
  const response = await fetch(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newsId }),
  });
  if (!response.ok) {
    throw new Error('북마크를 삭제하는데 실패했습니다.');
  }
  return response.json();
}
