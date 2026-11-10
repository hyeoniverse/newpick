import { create } from 'zustand';

interface MountState {
	isMounted: boolean;
	setMounted: () => void;
}

export const useMountStore = create<MountState>((set) => ({
	isMounted: false,
	setMounted: () => set({ isMounted: true }),
}));
