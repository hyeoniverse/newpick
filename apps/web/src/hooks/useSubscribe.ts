import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchSubscription, startSubscription, pauseSubscription, cancelSubscription } from '@/api/subscription';
import { fetchInterests, updateInterests } from '@/api/interests';

// 공통 에러 핸들링 함수
import { ToastType } from '@/models/toast.model';
const handleError = (error: Error, message: string, showToast: (msg: string, type: ToastType) => void) => {
	console.error(`🚨 ${message}:`, error.message);
	showToast(message, 'error');
};

// 구독 상태 조회 훅
export const useSubscribeStatus = () => {
	const {
		data: subscriptionStatus,
		isLoading: isStatusLoading,
		refetch: refetchStatus,
	} = useQuery({
		queryKey: ['subscriptionStatus'],
		queryFn: async () => {
			const status = await fetchSubscription();
			return status;
		},
		enabled: true,
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	return { status: subscriptionStatus, isStatusLoading, refetchStatus };
};

// 구독 관련 mutation 훅
export const useSubscribeMutation = (refreshSubscription: () => void) => {
	const { refetchUser } = useAuth();
	const { showToast } = useToast();

	const suspendOptions = (mutationFn: () => Promise<void>, successMsg: string, errorMsg: string) => ({
		mutationFn,
		onSuccess: async () => {
			await refreshSubscription();
			await refetchUser();
			showToast(successMsg, 'success');
		},
		onError: (error: Error) => handleError(error, `${errorMsg}`, showToast),
	});

	const startOptions = <TVariables>(
		mutationFn: (variables: TVariables) => Promise<void>,
		successMsg: string,
		errorMsg: string
	): UseMutationOptions<void, Error, TVariables, unknown> => ({
		mutationFn,
		onSuccess: async () => {
			await refreshSubscription();
			await refetchUser();
			showToast(successMsg, 'success');
		},
		onError: (error: Error) => handleError(error, errorMsg, showToast),
	});

	return {
		startMutation: useMutation(
			startOptions(startSubscription, '구독이 완료되었습니다!', '구독 중 오류가 발생했습니다. 다시 시도해주세요.')
		),
		pauseMutation: useMutation(
			suspendOptions(
				pauseSubscription,
				'구독이 일시정지되었습니다.',
				'구독 일시정지 중 오류가 발생했습니다. 다시 시도해주세요.'
			)
		),
		cancelMutation: useMutation(
			suspendOptions(
				cancelSubscription,
				'구독이 해지되었습니다.',
				'구독 해지 중 오류가 발생했습니다. 다시 시도해주세요.'
			)
		),
	};
};

// 구독 관심사 훅
export const useSubscribeInterests = () => {
	const { user } = useAuth();

	const {
		data: interests,
		isLoading: isInterestsLoading,
		// refetch: refetchInterests,
	} = useQuery({
		queryKey: ['subscriptionInterests'],
		queryFn: () => fetchInterests(),
		enabled: !!user,
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	const updateMutation = useMutation({
		mutationFn: updateInterests,
		// onSuccess: () => showToast('관심사가 업데이트되었습니다.', 'success'),
		// onError: (error: Error) => handleError(error, '관심사 업데이트에 실패했습니다.', showToast),
	});

	return { interests, isInterestsLoading, updateMutation };
};

// 구독 요청을 통합하는 훅
export const useSubscribe = () => {
	const { user } = useAuth();
	const { showToast } = useToast();
	const { status, isStatusLoading, refetchStatus } = useSubscribeStatus();
	const { startMutation, pauseMutation, cancelMutation } = useSubscribeMutation(refetchStatus);
	const { updateMutation } = useSubscribeInterests();

	const validateSubscribe = ({
		selectedInterests,
		isChecked,
	}: {
		selectedInterests: string[];
		isChecked: boolean | undefined;
	}) => {
		if (!user) return showToast('로그인이 필요합니다.', 'info'), false;
		if (!user.id) return showToast('로그인 정보를 불러올 수 없습니다.', 'error'), false;
		if (selectedInterests.length === 0)
			return showToast('최소 한 개 이상의 관심사를 선택해야 합니다.', 'warning'), false;
		if (user.isSubscribed === null && !isChecked)
			return showToast('약관에 동의해야 구독할 수 있습니다.', 'warning'), false;
		return true;
	};

	const handleSubscribe = async ({
		interests,
		isChecked,
	}: {
		interests: string[];
		isChecked: boolean | undefined;
	}) => {
		if (!user || !validateSubscribe({ selectedInterests: interests, isChecked })) return false;

		const isSubscribed = await (user.isSubscribed === null || user.isSubscribed === false
			? handleStart(interests)
			: handleUpdate(interests));

		if (!isSubscribed) {
			showToast('구독 중 오류가 발생했습니다.', 'error');
		}

		return isSubscribed;
	};

	const handleStart = async (interests: string[]) => {
		try {
			await startMutation.mutateAsync(interests);
			startMutation.reset(); // 성공 후 상태 초기화

			return true;
		} catch (error) {
			console.error('❌ 구독 시작 중 예외 발생:', error);
			return false;
		}
	};

	const handleReStart = async () => {
		try {
			await startMutation.mutateAsync([]);
			return true;
		} catch (error) {
			console.error('❌ 구독 재시작 중 예외 발생:', error);
			return false;
		}
	};

	const handlePause = async () => {
		try {
			await pauseMutation.mutateAsync();
			if (pauseMutation.isError) {
				console.error('❌ 구독 일시정지 실패:', pauseMutation.error);
				return false;
			}
			return true;
		} catch (error) {
			console.error('❌ 구독 일시정지 중 예외 발생:', error);
			return false;
		}
	};

	const handleCancel = async () => {
		try {
			await cancelMutation.mutateAsync();
			if (cancelMutation.isError) {
				console.error('❌ 구독 해지 실패:', cancelMutation.error);
				return false;
			}
			return true;
		} catch (error) {
			console.error('❌ 구독 해지 중 예외 발생:', error);
			return false;
		}
	};

	const handleUpdate = async (newInterests: string[]) => {
		try {
			await updateMutation.mutateAsync(newInterests);
			return true;
		} catch (error) {
			console.error('❌ 관심사 업데이트 중 예외 발생:', error);
			return false;
		}
	};

	const toggleSubscribe = () => (status === true ? handlePause() : handleReStart());

	return {
		handleSubscribe,
		handlePause,
		handleCancel,
		toggleSubscribe,
		status,
		isChanging:
			startMutation.isPending || pauseMutation.isPending || cancelMutation.isPending || updateMutation.isPending,
		isLoading: isStatusLoading,
		refreshSubscription: refetchStatus,
		validateSubscribe,
	};
};

export default useSubscribe;
