import { create } from 'zustand';

interface TabState {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

const useTabStore = create<TabState>((set) => ({
	activeTab: 'subscriptions', // 기본값 설정
	setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useTabStore;
