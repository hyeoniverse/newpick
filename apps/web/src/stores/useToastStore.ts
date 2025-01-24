import { create } from 'zustand';
import { TOAST } from '@/constants/numbers';
import { ToastItem, ToastType, ToastPosition } from '@/models/toast.model';

interface ToastState {
	toasts: ToastItem[];
	position: ToastPosition;
	addToast: (message: string, type?: ToastType, duration?: number) => number;
	removeToast: (id: number) => void;
	setPosition: (position: ToastPosition) => void;
}

const useToastStore = create<ToastState>((set) => ({
	toasts: [],
	position: 'center-bottom',

	addToast: (message, type = 'info', duration = TOAST.DURATION): number => {
		const newToast: ToastItem = {
			id: Date.now(),
			message,
			type,
			duration,
		};

		set((state) => {
			// 최대 개수 초과 시 오래된 토스트 제거
			const updatedToasts = [...state.toasts, newToast];
			if (updatedToasts.length > TOAST.MAX_TOASTS) {
				updatedToasts.shift(); // 가장 오래된 토스트 제거
			}
			return { toasts: updatedToasts };
		});

		return newToast.id;
	},

	removeToast: (id: number) =>
		set((state) => ({
			toasts: state.toasts.filter((toast) => toast.id !== id),
		})),

	setPosition: (position: ToastPosition) =>
		set(() => ({
			position,
		})),
}));

export default useToastStore;
