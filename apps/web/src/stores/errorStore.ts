import { create } from 'zustand';

// Zustand 기반 전역 에러 상태 관리
interface ErrorState {
	error: string | null;
	showErrorToast: boolean;
	setError: (message: string | null) => void;
	clearError: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
	error: null,
	showErrorToast: false,
	setError: (message) => set({ error: message, showErrorToast: true }),
	clearError: () => set({ error: null, showErrorToast: false }),
}));
