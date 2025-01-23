import useLoadingStore from '@/stores/useLoadingStore';

const useLoading = () => {
	const { isLoading, setLoading } = useLoadingStore();

	return {
		isLoading,
		startLoading: () => setLoading(true),
		stopLoading: () => setLoading(false),
	};
};

export default useLoading;
