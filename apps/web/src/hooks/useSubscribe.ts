import { API_ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useCookie } from './useCookie';

// 구독 시작 요청 (POST)
const startSubscription = async ({ userId }: { userId: number }) => {
	if (!userId) throw new Error('사용자 ID가 없습니다.');

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.START}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 요청 실패:', response.status, errorText);
		throw new Error(`구독 요청 실패: ${errorText}`);
	}

	return response.json();
};

// 구독 일시정지 (POST)
const pauseSubscription = async ({ userId }: { userId: number }) => {
	if (!userId) {
		throw new Error('사용자 ID가 없습니다.');
	}

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.PAUSE}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 일시정지 실패:', response.status, errorText);
		throw new Error(`구독 일시정지 실패: ${errorText}`);
	}

	return response.json();
};

// 구독 취소 요청 (DELETE)
const cancelSubscription = async ({ userId }: { userId: number }) => {
	if (!userId) {
		throw new Error('사용자 ID가 없습니다.');
	}

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.CANCEL}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 취소 실패:', response.status, errorText);
		throw new Error(`구독 취소 실패: ${errorText}`);
	}

	return response.json();
};

// 구독 상태 조회 (GET)
const fetchSubscription = async ({ userId }: { userId: number | undefined }) => {
	if (!userId) {
		throw new Error('사용자 ID가 없습니다.');
	}

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.STATUS(userId)}`, {
		method: 'GET',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 상태 조회 실패:', response.status, errorText);
		throw new Error(`구독 상태 조회 실패: ${errorText}`);
	}

	const data = await response.json();
	return data.status;
};

// const fetchSubscriptionHistory = async ({ queryKey }: { queryKey: [string, number | undefined] }) => {
// 	const [, userId] = queryKey; // queryKey에서 userId를 추출

// 	if (!userId) {
// 		throw new Error('사용자 ID가 없습니다.');
// 	}

// 	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.HISTORY(userId)}`, {
// 		method: 'GET',
// 		credentials: 'include',
// 		headers: { 'Content-Type': 'application/json' },
// 	});

// 	if (!response.ok) {
// 		const errorText = await response.text();
// 		console.error('❌ 구독 기록 조회 실패:', response.status, errorText);
// 		throw new Error(`구독 기록 조회 실패: ${errorText}`);
// 	}

// 	const data = await response.json();
// 	return data;
// };

// 구독 관심사 조회 (GET)
const fetchInterests = async ({ token }: { token: string | null }) => {
	if (!token) {
		throw new Error('유효한 토큰이 없습니다.');
	}

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.INTERESTS}`, {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 관심사 조회 실패:', response.status, errorText);
		throw new Error(`구독 관심사 조회 실패: ${errorText}`);
	}

	const data = await response.json();
	return data;
};

// 구독 관심사 수정 (PATCH)
const updateInterests = async ({ token, interests }: { token: string | null; interests: string[] }) => {
	if (!token || interests.length === 0) {
		throw new Error('유효한 토큰 또는 관심사가 없습니다.');
	}

	console.log('수정 중...', interests);

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.INTERESTS}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ interests }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 관심사 수정 실패:', response.status, errorText);
		throw new Error(`구독 관심사 수정 실패: ${errorText}`);
	}

	return response.json();
};

// 구독 상태 변경 훅
export const useSubscribeMutation = (refreshSubscriptionStatus: () => void) => {
	// 구독 요청
	const startMutation = useMutation({
		mutationFn: startSubscription,
		onSuccess: async () => {
			// 최신 구독 상태 반영
			await refreshSubscriptionStatus();
		},
		onError: (error: Error) => {
			console.error('🚨 구독 요청 실패:', error.message);
		},
	});

	// 구독 일시정지 요청
	const pauseMutation = useMutation({
		mutationFn: pauseSubscription,
		onSuccess: async () => {
			// 최신 구독 상태 반영
			await refreshSubscriptionStatus();
		},
		onError: (error: Error) => {
			console.error('🚨 구독 일시정지 실패:', error.message);
		},
	});

	// 구독 취소 요청
	const cancelMutation = useMutation({
		mutationFn: cancelSubscription,
		onSuccess: async () => {
			// 최신 구독 상태 반영
			await refreshSubscriptionStatus();
		},
		onError: (error: Error) => {
			console.error('🚨 구독 취소 실패:', error.message);
		},
	});

	return { startMutation, cancelMutation, pauseMutation };
};

// 구독 상태 조회 훅
export const useSubscribeStatus = () => {
	const { user, setUser } = useAuthStore();
	const queryClient = useQueryClient();

	// 구독 상태 조회 쿼리
	const {
		data: subscriptionStatus,
		isLoading: isStatusLoading,
		refetch: refetchStatus,
	} = useQuery<string, Error, string, [string]>({
		queryKey: ['subscriptionStatus'], // userId를 두 번째 인자로 전달
		queryFn: () => fetchSubscription({ userId: user?.id }),
		enabled: !!user?.id, // 사용자가 존재할 때만 실행
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	// 구독 기록 조회 쿼리
	// const {
	// 	data: subscriptionHistory,
	// 	isLoading: isHistoryLoading,
	// 	refetch: refetchHistory,
	// } = useQuery<boolean[] | undefined, Error, boolean[] | undefined, [string, number | undefined]>({
	// 	queryKey: ['subscriptionHistory', user?.id],
	// 	queryFn: fetchSubscriptionHistory,
	// 	enabled: !!user?.id,
	// 	retry: 1,
	// 	staleTime: 1000 * 60 * 5,
	// });

	// 구독 상태 갱신 함수
	const refreshSubscription = async () => {
		await queryClient.invalidateQueries({ queryKey: ['subscriptionStatus', user?.id] });
		const { data } = await refetchStatus();
		return data;
	};

	const statusRef = useRef<boolean | null>(null);

	// Zustand 상태 업데이트 (구독 상태 변경 시)
	useEffect(() => {
		if (user?.id !== undefined) {
			// 구독 기록이 없으면 유저의 구독 상태를 null로 설정
			statusRef.current = subscriptionStatus === 'active' ? true : subscriptionStatus === 'paused' ? false : null;

			if (user.isSubscribed !== statusRef.current) {
				const updatedUser = { ...user, isSubscribed: statusRef.current };
				setUser(updatedUser);
			}
		}
	}, [subscriptionStatus, user, setUser]);

	const status = statusRef.current;

	return {
		status,
		isStatusLoading,
		refreshSubscription,
	};
};

export const useSubscribeInterests = () => {
	const { user } = useAuth();
	const { getAuthCookies } = useCookie();
	const { token } = getAuthCookies();

	// 구독 관심사 조회
	const {
		data: interests,
		isLoading: isInterestsLoading,
		refetch: refetchInterests,
	} = useQuery<string[], Error, string[], [string]>({
		queryKey: ['subscriptionInterests'],
		queryFn: () => fetchInterests({ token: token }),
		enabled: !!user?.id,
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	// 구독 관심사 업데이트
	const updateMutation = useMutation({
		mutationFn: updateInterests,
		onSuccess: async () => {
			await refetchInterests(); // 최신 관심사 데이터 반영
		},
		onError: (error: Error) => {
			console.error('🚨 관심사 업데이트 실패:', error.message);
		},
	});

	return { interests, isInterestsLoading, updateMutation };
};

// 최종적으로 구독 상태 & 요청을 통합하는 훅
export const useSubscribe = () => {
	const { user } = useAuth();
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
		isChecked: boolean;
	}) => {
		if (!user) {
			showToast('로그인이 필요합니다.', 'info');
			return false;
		}

		if (!user.id) {
			console.error('❌ 유효하지 않은 userId:', user.id);
			showToast('로그인 정보를 불러올 수 없습니다.', 'error');
			return false;
		}

		if (selectedInterests.length === 0) {
			showToast('최소 한 개 이상의 관심사를 선택해야 합니다.', 'warning');
			return false;
		}

		if (user.isSubscribed === null && !isChecked) {
			showToast('약관에 동의해야 구독할 수 있습니다.', 'warning');
			return false;
		}

		return true;
	};

	const handleStart = (newInterests: string[]) => {
		if (!newInterests || !user?.id) return;

		console.log('newInterests:', newInterests);

		// 관심사 업데이트 먼저 수행
		updateMutation.mutate(
			{ token: token, interests: newInterests },
			{
				onSuccess: () => {
					// 관심사 업데이트 후 구독 시작 요청 실행
					startMutation.mutate(
						{ userId: user!.id },
						{
							onSuccess: () => showToast('구독이 완료되었습니다!', 'success'),
							onError: () => showToast(`구독에 실패했습니다.`, 'error'),
						}
					);
				},
				onError: () => {
					throw new Error('관심사 업데이트에 실패했습니다.');
				},
			}
		);

		if (startMutation.isSuccess) {
			return true;
		} else if (updateMutation.isError || startMutation.isError) {
			return false;
		}
	};

	const handleReStart = () => {
		startMutation.mutate(
			{ userId: user!.id },
			{
				onSuccess: () => showToast('구독이 완료되었습니다!', 'success'),
				onError: () => showToast(`구독에 실패했습니다.`, 'error'),
			}
		);

		if (startMutation.isSuccess) {
			return true;
		} else if (startMutation.isError) {
			return false;
		}
	};

	const handlePause = () => {
		pauseMutation.mutate(
			{ userId: user!.id }, // 현재 로그인한 사용자 ID
			{
				onSuccess: () => {
					showToast('구독이 일시정지 되었습니다.', 'success');
				},
				onError: () => {
					showToast('구독 일시정지 중 오류가 발생했습니다.', 'error');
				},
			}
		);

		if (cancelMutation.isSuccess) {
			return true;
		} else if (cancelMutation.isError) {
			return false;
		}
	};

	const handleUpdate = (newInterests: string[]) => {
		if (!user) return;

		updateMutation.mutate(
			{ token: token, interests: newInterests },
			{
				onSuccess: () => showToast('관심사가 업데이트되었습니다.', 'success'),
				onError: () => showToast('관심사 업데이트에 실패했습니다.', 'error'),
			}
		);
	};

	const handleCancel = () => {
		cancelMutation.mutate(
			{ userId: user!.id }, // 현재 로그인한 사용자 ID
			{
				onSuccess: () => {
					showToast('구독이 해제되었습니다.', 'success');
				},
				onError: () => {
					showToast('구독 취소 중 오류가 발생했습니다.', 'error');
				},
			}
		);

		if (cancelMutation.isSuccess) {
			return true;
		} else if (cancelMutation.isError) {
			return false;
		}
	};

	const toggleSubscribe = () => {
		if (status === true) {
			handlePause();
		} else {
			handleReStart();
		}
	};

	return {
		startMutation,
		pauseMutation,
		cancelMutation,
		updateMutation,
		handleStart,
		handlePause,
		handleCancel,
		handleUpdate,
		toggleSubscribe,
		status,
		isChanging: startMutation.isPending || pauseMutation.isPending || cancelMutation.isPending,
		isLoading: isStatusLoading,
		refreshSubscription,
		validateSubscribe,
	};
};

export default useSubscribe;
