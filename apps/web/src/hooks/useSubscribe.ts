import { SUBSCRIPTION } from '@/copy';
import { queryKeys } from '@/api/queryKeys';
import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchSubscription, startSubscription, pauseSubscription, cancelSubscription } from '@/api/subscription';
import { fetchInterests, updateInterests } from '@/api/interests';
import { ToastType } from '@/types/toast';

// 실패는 mutation의 onError에서 토스트 한 번으로 알립니다. (호출하는 쪽은 성공 여부만 받습니다)
const handleError = (message: string, showToast: (msg: string, type: ToastType) => void) => showToast(message, 'error');

// 구독 상태 조회 훅
export const useSubscribeStatus = () => {
	const {
		data: subscriptionStatus,
		isLoading: isStatusLoading,
		refetch: refetchStatus,
	} = useQuery({
		queryKey: queryKeys.subscription.status,
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
		onError: () => handleError(errorMsg, showToast),
	});

	const startOptions = <TVariables>(
		mutationFn: (variables: TVariables) => Promise<void>,
		successMsg: string,
		errorMsg: string,
	): UseMutationOptions<void, Error, TVariables, unknown> => ({
		mutationFn,
		onSuccess: async () => {
			await refreshSubscription();
			await refetchUser();
			showToast(successMsg, 'success');
		},
		onError: () => handleError(errorMsg, showToast),
	});

	return {
		startMutation: useMutation(startOptions(startSubscription, SUBSCRIPTION.started, SUBSCRIPTION.startFailed)),
		pauseMutation: useMutation(suspendOptions(pauseSubscription, SUBSCRIPTION.paused, SUBSCRIPTION.pauseFailed)),
		cancelMutation: useMutation(suspendOptions(cancelSubscription, SUBSCRIPTION.cancelled, SUBSCRIPTION.cancelFailed)),
	};
};

// 구독 관심사 훅
export const useSubscribeInterests = () => {
	const { user } = useAuth();
	const { showToast } = useToast();

	const {
		data: interests,
		isLoading: isInterestsLoading,
		// refetch: refetchInterests,
	} = useQuery({
		queryKey: queryKeys.subscription.interests,
		queryFn: () => fetchInterests(),
		enabled: !!user,
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	const updateMutation = useMutation({
		mutationFn: updateInterests,
		onError: () => handleError(SUBSCRIPTION.interestsFailed, showToast),
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
		if (!user) return (showToast(SUBSCRIPTION.loginRequired, 'info'), false);
		if (!user.id) return (showToast(SUBSCRIPTION.userLoadFailed, 'error'), false);
		if (selectedInterests.length === 0) return (showToast(SUBSCRIPTION.pickOneOrMore, 'warning'), false);
		if (user.isSubscribed === null && !isChecked) return (showToast(SUBSCRIPTION.agreeRequired, 'warning'), false);
		return true;
	};

	const handleSubscribe = async ({ interests, isChecked }: { interests: string[]; isChecked: boolean | undefined }) => {
		if (!user || !validateSubscribe({ selectedInterests: interests, isChecked })) return false;

		return user.isSubscribed === null || user.isSubscribed === false ? handleStart(interests) : handleUpdate(interests);
	};

	/** 실패 알림은 각 mutation의 onError가 맡으므로 여기서는 성공 여부만 돌려줍니다. */
	const run = async (mutate: () => Promise<unknown>) => {
		try {
			await mutate();
			return true;
		} catch {
			return false;
		}
	};

	const handleStart = (interests: string[]) =>
		run(async () => {
			await startMutation.mutateAsync(interests);
			startMutation.reset();
		});
	const handleReStart = () => run(() => startMutation.mutateAsync([]));
	const handlePause = () => run(() => pauseMutation.mutateAsync());
	const handleCancel = () => run(() => cancelMutation.mutateAsync());
	const handleUpdate = (newInterests: string[]) => run(() => updateMutation.mutateAsync(newInterests));

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
