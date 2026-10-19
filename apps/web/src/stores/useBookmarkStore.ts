'use client';

import { create } from 'zustand';

interface BookmarkUIState {
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
