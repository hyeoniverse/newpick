'use client';

import { create } from 'zustand';
import API_ENDPOINTS from '@/constants/api';
import { BookmarkItem } from '@/lib/bookmarkApi';

interface BookmarkState {
  bookmarks: BookmarkItem[];
  setBookmarks: (items: BookmarkItem[]) => void;

  addBookmarkLocally: (item: BookmarkItem) => void;
  removeBookmarkLocally: (newsId: number) => void;

  fetchBookmarks: () => Promise<void>;
  toggleBookmark: (newsId: number) => Promise<void>;

  isLoading: boolean;
  error: string | null;

  lastFetchedAt: number | null; //마지막으로 북마크 목록을 fetch한 시간 - 캐싱
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  setBookmarks: (items) => set({ bookmarks: items }),

  addBookmarkLocally: (item) => {
    set((state) => ({
      bookmarks: [...state.bookmarks, item],
    }));
  },

  removeBookmarkLocally: (newsId) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => b.newsId !== newsId),
    }));
  },

  // 북마크 목록
  fetchBookmarks: async () => {
    const { lastFetchedAt } = get();
    const now = Date.now();

    if (lastFetchedAt && now - lastFetchedAt < 5 * 60_000) {    // 캐싱 5분
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // GET /mypage/bookmarks
      const res = await fetch(API_ENDPOINTS.MYPAGE.BOOKMARKS, {
        credentials: 'include', // 세션 쿠키
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || '북마크를 불러오는데 실패했습니다.');
      }
      const data: BookmarkItem[] = await res.json();

      set({
        bookmarks: data,
        isLoading: false,
        error: null,
        lastFetchedAt: now,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message ?? '북마크를 불러오는데 실패했습니다.',
      });
    }
  },

  //북마크 추가/삭제
  toggleBookmark: async (newsId) => {
    const { bookmarks } = get();
    const matchBookmark = bookmarks.find((b) => b.newsId === newsId);

    try {
      if (matchBookmark) {
        // DELETE /feedback/bookmark
        const res = await fetch(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newsId }),
          credentials: 'include',
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || '북마크를 삭제하는데 실패했습니다.');
        }
        get().removeBookmarkLocally(newsId);
      } else {
        // POST /feedback/bookmark
        const res = await fetch(API_ENDPOINTS.FEEDBACK.BOOKMARK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newsId }),
          credentials: 'include',
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || '북마크를 추가하는데 실패했습니다.');
        }
        const newItem: BookmarkItem = await res.json();
        get().addBookmarkLocally(newItem);
      }
    } catch (err: any) {
      set({ error: err.message || '북마크 추가/삭제에 실패했습니다.' });
    }
  },
}));
