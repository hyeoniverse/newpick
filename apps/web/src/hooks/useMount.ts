import { useEffect } from 'react';
import useMountStore from '@/stores/mountStore';

const useMount = () => {
	const { isMounted, setMounted } = useMountStore();

	useEffect(() => {
		if (!isMounted) {
			setMounted();
		}
	}, [isMounted, setMounted]);

	return isMounted;
};

export default useMount;
