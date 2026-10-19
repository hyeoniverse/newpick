import useTabStore from '@/stores/useTabStore';

export const useTab = () => {
	const { activeTab, setActiveTab } = useTabStore();

	return {
		activeTab,
		setActiveTab,
	};
};
