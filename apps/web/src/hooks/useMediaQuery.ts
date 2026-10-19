import { useEffect, useState } from 'react';
import { getTheme } from '@/styles/theme';

export const useMediaQuery = () => {
	const [isMobile, setIsMobile] = useState(false);
	const [isTablet, setIsTablet] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const theme = getTheme('light');
			const isMobileQuery = window.matchMedia(theme.mediaQuery.mobile);
			const isTabletQuery = window.matchMedia(theme.mediaQuery.tablet);

			const handleResize = () => {
				setIsMobile(isMobileQuery.matches);
				setIsTablet(isTabletQuery.matches);
			};

			handleResize(); // 초기값 설정
			isMobileQuery.addEventListener('change', handleResize);
			isTabletQuery.addEventListener('change', handleResize);

			return () => {
				isMobileQuery.removeEventListener('change', handleResize);
				isTabletQuery.removeEventListener('change', handleResize);
			};
		}
	}, []);

	return { isMobile, isTablet };
};
