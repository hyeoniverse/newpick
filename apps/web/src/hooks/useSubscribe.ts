import { API_ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// 구독 시작 요청 (POST)
const startSubscribe = async ({ email, userId }: { email: string; userId: number }) => {
	if (!email || !userId) throw new Error('이메일 또는 사용자 ID가 없습니다.');

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.START}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, userId }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 요청 실패:', response.status, errorText);
		throw new Error(`구독 요청 실패: ${errorText}`);
	}

	return response.json();
};

// 구독 취소 요청 (POST) -> 추후 DELETE로 변경
const endSubscribe = async ({ userId }: { userId: number }) => {
	if (!userId) throw new Error('사용자 ID가 없습니다.');

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.END}/${userId}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ 구독 취소 실패:', response.status, errorText);
		throw new Error(`구독 취소 실패: ${errorText}`);
	}

	return response.json();
};

// 구독 요청 & 취소 요청을 관리하는 훅
export const useSubscribeMutation = (refreshSubscriptionStatus: () => void) => {
	// 구독 요청
	const subscribeMutation = useMutation({
		mutationFn: startSubscribe,
		onSuccess: async () => {
			// 최신 구독 상태 반영
			await refreshSubscriptionStatus();
		},
		onError: (error: Error) => {
			console.error('🚨 구독 요청 실패:', error.message);
		},
	});

	// 구독 취소 요청
	const unsubscribeMutation = useMutation({
		mutationFn: endSubscribe,
		onSuccess: async () => {
			// 최신 구독 상태 반영
			await refreshSubscriptionStatus();
		},
		onError: (error: Error) => {
			console.error('🚨 구독 취소 실패:', error.message);
		},
	});

	return { subscribeMutation, unsubscribeMutation };
};

// 구독 상태 조회 (GET)
const fetchSubscriptionStatus = async ({ queryKey }: { queryKey: [string, number | undefined] }) => {
	const [, userId] = queryKey; // queryKey에서 userId를 추출

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
	return data.active;
};

// 구독 상태 관리 훅
export const useSubscribeStatus = () => {
	const { user, setUser } = useAuthStore();
	const queryClient = useQueryClient();

	// `useQuery`에서 queryKey를 올바르게 전달
	const {
		data: subscriptionStatus,
		isLoading: isSubscriptionLoading,
		refetch,
	} = useQuery<boolean, Error, boolean, [string, number | undefined]>({
		queryKey: ['subscriptionStatus', user?.id], // ✅ userId를 두 번째 인자로 전달
		queryFn: fetchSubscriptionStatus, // ✅ userId를 queryKey에서 추출하도록 설정
		enabled: !!user?.id, // 사용자가 존재할 때만 실행
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	// 강제 갱신 함수
	const refreshSubscriptionStatus = async () => {
		await queryClient.invalidateQueries({ queryKey: ['subscriptionStatus', user?.id] });
		const { data } = await refetch(); // 최신 데이터 강제 로드
		return data;
	};

	// Zustand 상태 업데이트 (구독 상태 변경 시)
	useEffect(() => {
		if (subscriptionStatus !== undefined && user?.isSubscribed !== subscriptionStatus && user?.id !== undefined) {
			if (user.isSubscribed !== subscriptionStatus) {
				setUser({ ...user, isSubscribed: subscriptionStatus });
			}
		}
	}, [subscriptionStatus, user, setUser]);

	return { subscriptionStatus, isSubscriptionLoading, refreshSubscriptionStatus };
};

// 최종적으로 구독 상태 & 요청을 통합하는 훅
export const useSubscribe = () => {
	const { subscriptionStatus, isSubscriptionLoading, refreshSubscriptionStatus } = useSubscribeStatus();
	const { subscribeMutation, unsubscribeMutation } = useSubscribeMutation(refreshSubscriptionStatus);

	return {
		subscribeMutation,
		unsubscribeMutation,
		subscriptionStatus,
		isSubscriptionLoading,
		refreshSubscriptionStatus,
	};
};

export default useSubscribe;
