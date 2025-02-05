import { create } from 'zustand';

interface InterestState {
	selectedInterests: string[];
	setSelectedInterests: (interests: string[]) => void;
}

const useInterestsStore = create<InterestState>((set) => ({
	selectedInterests: [],
	addInterest: (interest: string) => set((state) => ({ selectedInterests: [...state.selectedInterests, interest] })),
	setSelectedInterests: (interests) => set({ selectedInterests: interests }),
}));

export default useInterestsStore;
