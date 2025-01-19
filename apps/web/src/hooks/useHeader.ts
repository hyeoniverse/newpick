import { useHeaderStore } from '@/stores/headerStore';

export const useHeader = () => {
	const { isOpen: isHeaderOpen, setOpen: setHeaderOpen, isSubOpen, setSubOpen } = useHeaderStore();

	const headerHeight = isHeaderOpen && isSubOpen ? '6rem' : isHeaderOpen || isSubOpen ? '3rem' : '0';

	return {
		isHeaderOpen,
		setHeaderOpen,
		isSubOpen,
		setSubOpen,
		headerHeight,
	};
};
