import { useHeaderStore } from '@/stores/useHeaderStore';

export const useHeader = () => {
	const { isOpen: isHeaderOpen, setOpen: setHeaderOpen } = useHeaderStore();

	const headerHeight = isHeaderOpen ? '3rem' : '0';

	return {
		isHeaderOpen,
		setHeaderOpen,
		headerHeight,
	};
};
