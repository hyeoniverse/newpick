import {
  fetchUserBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
  BookmarkItem,
} from '@/lib/bookmarkApi';

export async function getUserBookmarks(): Promise<BookmarkItem[]> {
  return await fetchUserBookmarksApi();
}

export async function addUserBookmark(newsId: number): Promise<BookmarkItem> {
  return await addBookmarkApi(newsId);
}

export async function removeUserBookmark(newsId: number): Promise<{ success: boolean }> {
  return await removeBookmarkApi(newsId);
}
