import {
  fetchUserBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
  BookmarkItem,
} from '@/lib/bookmarkApi';

export async function getUserBookmarks(): Promise<BookmarkItem[]> {
  return await fetchUserBookmarksApi();
}

export async function addUserBookmark(userId: number, newsId: number): Promise<BookmarkItem> {
  return await addBookmarkApi(userId, newsId);
}

export async function removeUserBookmark(userId: number, newsId: number): Promise<{ success: boolean }> {
  return await removeBookmarkApi(userId, newsId);
}
