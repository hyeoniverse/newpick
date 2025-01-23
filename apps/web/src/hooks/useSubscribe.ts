import { API_ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// 구독 요청 (POST)
const startSubscribe = async ({ email, userId }: { email: string; userId: number }) => {
	if (!email || !userId) {
		throw new Error('이메일 또는 사용자 ID가 없습니다.');
	}

	const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.START}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email, userId }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ API 요청 실패:', response.status, errorText);
		throw new Error(`구독 요청 실패: ${errorText}`);
	}

	return response.json();
};

// 구독 상태 조회 (GET)
const useSubscriptionStatus = () => {
	const { user } = useAuthStore();

	// 구독 상태 조회 함수
	const fetchSubscriptionStatus = async (): Promise<boolean> => {
		if (!user?.id) throw new Error('User ID is missing');

		const response = await fetch(`${API_ENDPOINTS.SUBSCRIBERS.STATUS(user.id)}`, {
			method: 'GET',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) throw new Error('Failed to fetch subscription status');
		const data = await response.json();
		return data.active;
	};

	// `useQuery`를 사용하여 구독 상태 조회
	const { data: subscriptionStatus, isLoading: isSubscriptionLoading } = useQuery<boolean>({
		queryKey: ['subscriptionStatus', user?.id], // 사용자 ID 기반 캐싱
		queryFn: fetchSubscriptionStatus,
		enabled: !!user?.id, // 사용자가 존재할 때만 실행
		retry: 1,
		staleTime: 1000 * 60 * 5,
	});

	return { subscriptionStatus, isSubscriptionLoading };
};

// 구독 요청 & 구독 상태 조회를 함께 사용하는 `useSubscribe`
export const useSubscribe = () => {
	const queryClient = useQueryClient();
	const { subscriptionStatus, isSubscriptionLoading } = useSubscriptionStatus();

	const subscribeMutation = useMutation({
		mutationFn: startSubscribe,
		onSuccess: () => {
			// 구독 상태 갱신
			queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
		},
		onError: (error: Error) => {
			console.error('🚨 구독 요청 실패:', error.message);
		},
	});

	return { subscribeMutation, subscriptionStatus, isSubscriptionLoading };
};
