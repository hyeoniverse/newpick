'use client';

import { create } from 'zustand';

interface BookmarkUIState {
  // 예: 북마크 필터, 모달 상태 등 UI 관련 상태
  filter: string;
  setFilter: (filter: string) => void;

  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export const useBookmarkStore = create<BookmarkUIState>((set) => ({
  filter: '',
  setFilter: (filter) => set({ filter }),

  modalOpen: false,
  setModalOpen: (open) => set({ modalOpen: open }),
}));
