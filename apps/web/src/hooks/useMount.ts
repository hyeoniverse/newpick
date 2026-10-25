import { useEffect } from 'react';
import useMountStore from '@/stores/useMountStore';

export const useMount = () => {
	const { isMounted, setMounted } = useMountStore();

	useEffect(() => {
		if (!isMounted) {
			setMounted();
		}
	}, [isMounted, setMounted]);

	return { isMounted };
};
