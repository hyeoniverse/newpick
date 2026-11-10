import { create } from 'zustand';

interface InterestState {
	selectedInterests: string[];
	setSelectedInterests: (interests: string[]) => void;
}

export const useInterestStore = create<InterestState>((set) => ({
	selectedInterests: [],
	setSelectedInterests: (interests) => set({ selectedInterests: interests }),
}));
