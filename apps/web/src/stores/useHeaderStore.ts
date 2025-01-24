import { create } from 'zustand';

interface HeaderState {
	isOpen: boolean;
	setOpen: (open: boolean) => void;
	isSubOpen: boolean;
	setSubOpen: (open: boolean) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
	isOpen: true,
	setOpen: (open) => set({ isOpen: open }),
	isSubOpen: false,
	setSubOpen: (open) => set({ isSubOpen: open }),
}));
