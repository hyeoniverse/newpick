import API_ENDPOINTS from '@/constants/api';

export interface BookmarkItem {
  newsId: number;
  newsletterId: number;
  title: string;
  image: string;
  description: string;
  rating?: number;
  createdAt: string;
}

// 북마크 목록 조회
export async function fetchUserBookmarksApi(): Promise<BookmarkItem[]> {
  const response = await fetch(API_ENDPOINTS.MYPAGE.BOOKMARKS);
  if (!response.ok) {
    throw new Error('아티클을 불러오는데 실패했습니다.');
  }
  return response.json();
}

// 북마크 추가
export async function addBookmarkApi(userId: number, newsId: number): Promise<BookmarkItem> {
  const response = await fetch(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newsId }),
  });
  if (!response.ok) {
    throw new Error('아티클을 불러오는데 실패했습니다.');
  }
  return response.json();
}

// 북마크 삭제
export async function removeBookmarkApi(userId: number, newsId: number): Promise<{ success: boolean }> {
  const response = await fetch(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newsId }),
  });
  if (!response.ok) {
    throw new Error('아티클을 불러오는데 실패했습니다.');
  }
  return response.json();
}
