import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuth } from '@/hooks/useAuth';
import { useCookie } from '@/hooks/useCookie';
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
	const { user, setUser } = useAuthStore();
	const queryClient = useQueryClient();

	const {
		data: subscriptionStatus,
		isLoading: isStatusLoading,
		refetch: refetchStatus,
	} = useQuery({
		queryKey: ['subscriptionStatus'],
		queryFn: () => fetchSubscription({ userId: user?.id }),
		enabled: !!user?.id,
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	const [status, setStatus] = useState<boolean | null>(null);

	useEffect(() => {
		if (user?.id !== undefined) {
			const newStatus = subscriptionStatus === 'active' ? true : subscriptionStatus === 'paused' ? false : null;
			if (user.isSubscribed !== newStatus) {
				setUser({ ...user, isSubscribed: newStatus });
			}
			setStatus(newStatus);
		}
	}, [subscriptionStatus, user, setUser]);

	const refreshSubscription = async () => {
		await queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
		return await refetchStatus();
	};

	return { status, isStatusLoading, refreshSubscription };
};

// 구독 관련 mutation 훅
export const useSubscribeMutation = (refreshSubscription: () => void) => {
	const { showToast } = useToast();

	const mutationOptions = (mutationFn: (variables: { userId: number }) => Promise<void>, successMsg: string) => ({
		mutationFn,
		onSuccess: async () => {
			await refreshSubscription();
			showToast(successMsg, 'success');
		},
		onError: (error: Error) => handleError(error, `${successMsg} 실패`, showToast),
	});

	return {
		startMutation: useMutation(mutationOptions(startSubscription, '구독이 완료되었습니다!')),
		pauseMutation: useMutation(mutationOptions(pauseSubscription, '구독이 일시정지되었습니다.')),
		cancelMutation: useMutation(mutationOptions(cancelSubscription, '구독이 해지되었습니다.')),
	};
};

// 구독 관심사 훅
export const useSubscribeInterests = () => {
	const { user, refetchUser } = useAuth();
	const { getAuthCookies } = useCookie();
	const { showToast } = useToast();
	const { token } = getAuthCookies();

	const {
		data: interests,
		isLoading: isInterestsLoading,
		refetch: refetchInterests,
	} = useQuery({
		queryKey: ['subscriptionInterests'],
		queryFn: () => fetchInterests({ token }),
		enabled: !!user?.id,
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	const updateMutation = useMutation({
		mutationFn: updateInterests,
		onSuccess: async () => {
			await refetchInterests();
			await refetchUser();
		},
		onError: (error: Error) => handleError(error, '관심사 업데이트 실패', showToast),
	});

	return { interests, isInterestsLoading, updateMutation };
};

// 구독 요청을 통합하는 훅
export const useSubscribe = () => {
	const { user, refetchUser } = useAuth();
	const { showToast } = useToast();
	const { status, isStatusLoading, refreshSubscription } = useSubscribeStatus();
	const { startMutation, pauseMutation, cancelMutation } = useSubscribeMutation(refreshSubscription);
	const { updateMutation } = useSubscribeInterests();
	const { getAuthCookies } = useCookie();
	const { token } = getAuthCookies();

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

	const handleSubscribe = ({ interests, isChecked }: { interests: string[]; isChecked: boolean | undefined }) => {
		if (!user || !validateSubscribe({ selectedInterests: interests, isChecked })) return false;
		return user.isSubscribed === null || user.isSubscribed === false
			? handleStart(interests)
			: handleUpdate(interests);
	};

	const handleStart = (interests: string[]) => {
		updateMutation.mutate(
			{ token, interests },
			{
				onSuccess: () => {
					startMutation.mutate({ userId: user!.id }, { onSuccess: async () => await refetchUser() });
				},
			}
		);
		return startMutation.isSuccess;
	};

	const handleReStart = () => {
		startMutation.mutate({ userId: user!.id });
		return startMutation.isSuccess;
	};

	const handlePause = () => {
		pauseMutation.mutate({ userId: user!.id });
		return pauseMutation.isSuccess;
	};

	const handleCancel = () => {
		cancelMutation.mutate({ userId: user!.id });
		return cancelMutation.isSuccess;
	};

	const handleUpdate = (newInterests: string[]) => {
		updateMutation.mutate({ token, interests: newInterests });
		return updateMutation.isSuccess;
	};

	const toggleSubscribe = () => (status ? handlePause() : handleReStart());

	return {
		handleSubscribe,
		handlePause,
		handleCancel,
		toggleSubscribe,
		status,
		isChanging: startMutation.isPending || pauseMutation.isPending || cancelMutation.isPending,
		isLoading: isStatusLoading,
		refreshSubscription,
		validateSubscribe,
	};
};

export default useSubscribe;
