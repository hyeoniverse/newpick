import { SUBSCRIPTION } from '@/copy';
import { queryKeys } from '@/api/queryKeys';
import { useMutation, UseMutationOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchSubscription, startSubscription, pauseSubscription, cancelSubscription } from '@/api/subscription';
import { fetchInterests, updateInterests } from '@/api/interests';
import { ToastType } from '@/types/toast';
import { useAuthStore } from '@/stores/useAuthStore';

// 실패는 mutation의 onError에서 토스트 한 번으로 알립니다. (호출하는 쪽은 성공 여부만 받습니다)
const handleError = (message: string, showToast: (msg: string, type: ToastType) => void) => showToast(message, 'error');

/**
 * 구독 상태 조회 훅. 로그인 표시 쿠키가 있을 때만 부른다: 로그인하지 않은 방문자도 부르면 401 → 토큰 갱신 401로
 * 콘솔 오류가 둘 남아 Lighthouse 권장사항이 깎였다. 결과는 예전과 같게 null(구독 안 함 · 모름)
 */
const useSubscribeStatus = () => {
	const signedIn = useAuthStore((state) => state.session === 'in');
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
		enabled: signedIn,
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	return { status: signedIn ? subscriptionStatus : null, isStatusLoading, refetchStatus };
};

// 구독 관련 mutation 훅
const useSubscribeMutation = (refreshSubscription: () => void) => {
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
const useSubscribeInterests = () => {
	const { user, refetchUser } = useAuth();
	const { showToast } = useToast();
	const queryClient = useQueryClient();

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

	// 바꾼 관심사를 다시 받는다: 안 그러면 user.interests가 예전 값으로 남아 설정 화면이 예전 선택으로 돌아가고,
	// 그대로 '완료'를 누르면 서버 값까지 예전으로 되돌아간다
	const updateMutation = useMutation({
		mutationFn: updateInterests,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.subscription.interests });
			await refetchUser();
		},
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
	// 일시정지 → 다시 켜기: 관심사는 보내지 않아 지금 것을 그대로 둔다 ([]를 보내면 모두 지워진다)
	const handleReStart = () => run(() => startMutation.mutateAsync(undefined));
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
