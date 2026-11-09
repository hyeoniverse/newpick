import { queryKeys } from '@/api/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/** 지켜보는 소식에 이어진 새 소식 (하루 한 번 판정) */
export interface FollowUpdate {
	id: number;
	heading: string;
	/** 무엇이 새로 나왔는지 한 줄 (판정을 못 한 날은 빈 문자열) */
	reason: string;
	storyIndex: number;
	createdAt: string;
	seenAt: string | null;
	newsletter: { id: number; createdAt: string; category: { name: string } };
}

export interface StoryFollow {
	id: number;
	heading: string;
	storyIndex: number;
	createdAt: string;
	newsletter: { id: number; createdAt: string; category: { name: string } };
	updates: FollowUpdate[];
	/** 오래(30일) 후속이 없어 정리할지 묻는 것 */
	quiet: boolean;
}

/** 뉴스레터 상세: 이 뉴스레터의 소식 가운데 내가 지켜보던 소식의 후속 */
export interface FollowUpdateIn {
	id: number;
	storyIndex: number;
	seenAt: string | null;
	follow: { heading: string; newsletter: { id: number; createdAt: string } };
}

/** 마이페이지: 지켜보는 소식마다 이어진 소식 */
export function useFollows() {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.follows.list(user?.id),
		queryFn: () => apiFetch<StoryFollow[]>(API_ENDPOINTS.MY.FOLLOWS()),
		enabled: !!user,
	});
}

/** 머리글: 아직 안 본 후속 소식 수 (창으로 돌아올 때마다 다시) */
export function useUnseenFollows() {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.follows.unseen(user?.id),
		queryFn: () => apiFetch<{ count: number }>(API_ENDPOINTS.MY.FOLLOWS_UNSEEN()),
		enabled: !!user,
		staleTime: 5 * 60 * 1000,
		select: (data) => data.count,
	});
}

/** 뉴스레터 상세: 이 뉴스레터에서 지켜보는 소식 (단추 상태) */
export function useNewsletterFollows(newsletterId: number) {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.follows.newsletter(user?.id, newsletterId),
		queryFn: () =>
			apiFetch<{ id: number; storyIndex: number; _count: { updates: number } }[]>(
				API_ENDPOINTS.MY.FOLLOWS_OF(newsletterId),
			),
		enabled: !!user,
	});
}

/** 뉴스레터 상세: 지켜보던 소식의 후속인 소식 (소식 위 표시) */
export function useNewsletterFollowUpdates(newsletterId: number) {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.follows.updates(user?.id, newsletterId),
		queryFn: () => apiFetch<FollowUpdateIn[]>(API_ENDPOINTS.MY.FOLLOW_UPDATES_IN(newsletterId)),
		enabled: !!user,
	});
}

export function useFollowMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.follows.all });

	const follow = useMutation({
		mutationFn: (body: { newsletterId: number; storyIndex: number }) =>
			apiFetch(API_ENDPOINTS.MY.FOLLOWS(), { method: 'POST', body }),
		onSuccess: () => showToast("후속이 나오면 마이페이지 '지켜보기'와 머리글에 표시합니다.", 'success'),
		onError: () => showToast('지켜보기를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error'),
		onSettled: refresh,
	});
	const unfollow = useMutation({
		mutationFn: (id: number) => apiFetch(API_ENDPOINTS.MY.FOLLOW(id), { method: 'DELETE' }),
		onSuccess: () => showToast('지켜보기를 그만두었습니다.', 'success'),
		onError: () => showToast('지켜보기를 끄지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error'),
		onSettled: refresh,
	});
	// newsletterId가 있으면 그 뉴스레터 상세에서 본 후속만
	const markSeen = useMutation({
		mutationFn: (newsletterId?: number) =>
			apiFetch(API_ENDPOINTS.MY.FOLLOWS_SEEN(), { method: 'POST', body: newsletterId ? { newsletterId } : {} }),
		onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.follows.all }),
	});
	const keep = useMutation({
		mutationFn: (id: number) => apiFetch(API_ENDPOINTS.MY.FOLLOW_KEEP(id), { method: 'POST' }),
		onSuccess: () => showToast('계속 지켜봅니다. 30일 뒤 다시 확인합니다.', 'success'),
		onError: () => showToast('잠시 후 다시 시도해 주세요.', 'error'),
		onSettled: refresh,
	});
	return { follow, unfollow, markSeen, keep };
}
