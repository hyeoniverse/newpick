import { useHeaderStore } from '@/stores/useHeaderStore';

export const useHeader = () => {
	const { isOpen: isHeaderOpen, setOpen: setHeaderOpen } = useHeaderStore();

	// 숨으면 '0px' (단위 없는 0은 calc(var(--header-height) + 45px) 같은 계산을 통째로 무효로 만든다)
	const headerHeight = isHeaderOpen ? '3rem' : '0px';

	return {
		isHeaderOpen,
		setHeaderOpen,
		headerHeight,
	};
};
