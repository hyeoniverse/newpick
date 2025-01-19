import useToastStore from '@/stores/toastStore';

export const useToast = () => {
	const showToast = useToastStore((state) => state.addToast);

	return { showToast };
};
