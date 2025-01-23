import { useErrorStore } from '@/stores/useErrorStore';
import { useToast } from '@/hooks/useToast';

// 전역 에러 상태 관리 + Toast 연동
export const useError = () => {
	const { error, setError, clearError } = useErrorStore();
	const { showToast } = useToast();

	// 에러 발생 시 Toast 자동 표시
	const showError = (message: string) => {
		setError(message);
		showToast(message, 'error'); // 에러 메시지를 Toast로 표시
	};

	return { error, showError, clearError };
};
