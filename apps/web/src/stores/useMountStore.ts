import { create } from 'zustand';

interface MountState {
	isMounted: boolean;
	setMounted: () => void;
}

const useMountStore = create<MountState>((set) => ({
	isMounted: false,
	setMounted: () => set({ isMounted: true }),
}));

export default useMountStore;
