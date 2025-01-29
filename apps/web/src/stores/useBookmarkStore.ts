'use client';

import { create } from 'zustand';
import { BookmarkItem } from '@/lib/bookmarkApi';
import {
  getUserBookmarks,
  addUserBookmark,
  removeUserBookmark,
} from '@/services/bookmarkService';

interface BookmarkState {
  bookmarks: BookmarkItem[];
  fetchBookmarks: () => Promise<void>;
  toggleBookmark: (newsId: number) => Promise<void>;

  setBookmarks: (items: BookmarkItem[]) => void;
  addBookmarkLocally: (item: BookmarkItem) => void;
  removeBookmarkLocally: (newsId: number) => void;

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
      const data = await getUserBookmarks();

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
        const result = await removeUserBookmark(newsId);
        if (!result.success) {
          throw new Error('북마크를 삭제하는데 실패했습니다.');
        }
        get().removeBookmarkLocally(newsId);

      } else {
        const newItem = await addUserBookmark(newsId);
        get().addBookmarkLocally(newItem);
      }
    } catch (err: any) {
      set({ error: err.message || '북마크 추가/삭제에 실패했습니다.' });
    }
  },
}));
