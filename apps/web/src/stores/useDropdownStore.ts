import { create } from 'zustand';

interface DropdownState {
	dropdowns: Record<string, boolean>;
	setOpen: (type: string, open: boolean) => void;
	closeAll: () => void;
	getState: () => Record<string, boolean>;
}

export const useDropdownStore = create<DropdownState>((set, get) => ({
	dropdowns: {},

	setOpen: (type, open) =>
		set((state) => ({
			dropdowns: { ...state.dropdowns, [type]: open },
		})),

	closeAll: () => set({ dropdowns: {} }),

	getState: () => get().dropdowns, // 현재 상태 즉시 가져오기
}));
