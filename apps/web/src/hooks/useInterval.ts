import { useEffect, useRef } from 'react';

export const useInterval = (callback: () => void, delay: number | null, resetKey: number) => {
	const savedCallback = useRef(callback);

	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	useEffect(() => {
		if (delay === null) return;
		const id = setInterval(() => savedCallback.current(), delay);
		return () => clearInterval(id);
	}, [delay, resetKey]); // resetKey 의존성 추가
};
