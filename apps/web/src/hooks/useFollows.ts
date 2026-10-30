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
}

const KEY = 'follows';

/** 마이페이지: 지켜보는 소식마다 이어진 소식 */
export function useFollows() {
	const { user } = useAuth();
	return useQuery({
		queryKey: [KEY, user?.id, 'list'],
		queryFn: () => apiFetch<StoryFollow[]>(API_ENDPOINTS.MY.FOLLOWS()),
		enabled: !!user,
	});
}

/** 머리글: 아직 안 본 후속 소식 수 (창으로 돌아올 때마다 다시) */
export function useUnseenFollows() {
	const { user } = useAuth();
	return useQuery({
		queryKey: [KEY, user?.id, 'unseen'],
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
		queryKey: [KEY, user?.id, 'newsletter', newsletterId],
		queryFn: () =>
			apiFetch<{ id: number; storyIndex: number; _count: { updates: number } }[]>(
				API_ENDPOINTS.MY.FOLLOWS_OF(newsletterId)
			),
		enabled: !!user,
	});
}

export function useFollowMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const refresh = () => queryClient.invalidateQueries({ queryKey: [KEY] });

	const follow = useMutation({
		mutationFn: (body: { newsletterId: number; storyIndex: number }) =>
			apiFetch(API_ENDPOINTS.MY.FOLLOWS(), { method: 'POST', body }),
		onSuccess: () =>
			showToast("후속 기사가 나오면 마이페이지 '지켜보기'와 머리글에 알려 드립니다.", 'success'),
		onError: () => showToast('지켜보기를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error'),
		onSettled: refresh,
	});
	const unfollow = useMutation({
		mutationFn: (id: number) => apiFetch(API_ENDPOINTS.MY.FOLLOW(id), { method: 'DELETE' }),
		onSuccess: () => showToast('지켜보기를 그만두었습니다.', 'success'),
		onError: () => showToast('지켜보기를 끄지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error'),
		onSettled: refresh,
	});
	const markSeen = useMutation({
		mutationFn: () => apiFetch(API_ENDPOINTS.MY.FOLLOWS_SEEN(), { method: 'POST' }),
		onSettled: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
	});
	return { follow, unfollow, markSeen };
}
