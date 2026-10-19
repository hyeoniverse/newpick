import { ToastType } from '@/models/toast.model';
import useToastStore from '@/stores/useToastStore';

export const useToast = () => {
	const { toasts, addToast, removeToast, setPosition, position } = useToastStore();

	const showToast = (message: string, type: ToastType, duration?: number) => {
		addToast(message, type, duration);
	};

	return {
		toasts,
		position,
		showToast,
		removeToast,
		setPosition,
	};
};
