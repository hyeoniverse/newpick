import { useEffect } from 'react';

export const useTimeout = (callback: () => void, delay: number | null) => {
	useEffect(() => {
		if (delay === null) return;

		const timer = setTimeout(callback, delay);

		return () => clearTimeout(timer);
	}, [callback, delay]);
};
