import { useEffect, useState } from 'react';
import { getTheme } from '@/styles/theme';

export const useMediaQuery = () => {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const isMobileQuery = window.matchMedia(getTheme('light').mediaQuery.mobile);

			const handleResize = () => {
				setIsMobile(isMobileQuery.matches);
			};

			handleResize(); // 초기값 설정
			isMobileQuery.addEventListener('change', handleResize);

			return () => {
				isMobileQuery.removeEventListener('change', handleResize);
			};
		}
	}, []);

	return { isMobile };
};
