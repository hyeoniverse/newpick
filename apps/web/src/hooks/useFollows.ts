import { COMMON, FOLLOWS } from '@/copy';
import { queryKeys } from '@/api/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	fetchFollowUpdatesIn,
	fetchFollows,
	fetchNewsletterFollows,
	fetchUnseenFollowCount,
	followStory,
	keepFollow,
	markFollowsSeen,
	unfollowStory,
	type FollowUpdate,
	type FollowUpdateIn,
	type StoryFollow,
} from '@/api/follows';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/** 지켜보기 응답 모양 (api/follows.ts) */
export type { FollowUpdate, FollowUpdateIn, StoryFollow };

/** 마이페이지: 지켜보는 소식마다 이어진 소식 */
export function useFollows() {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.follows.list(user?.id),
		queryFn: fetchFollows,
		enabled: !!user,
	});
}

/** 머리글: 아직 안 본 후속 소식 수 (창으로 돌아올 때마다 다시) */
export function useUnseenFollows() {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.follows.unseen(user?.id),
		queryFn: fetchUnseenFollowCount,
		enabled: !!user,
		staleTime: 5 * 60 * 1000,
	});
}

/** 뉴스레터 상세: 이 뉴스레터에서 지켜보는 소식 (단추 상태) */
export function useNewsletterFollows(newsletterId: number) {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.follows.newsletter(user?.id, newsletterId),
		queryFn: () => fetchNewsletterFollows(newsletterId),
		enabled: !!user,
	});
}

/** 뉴스레터 상세: 지켜보던 소식의 후속인 소식 (소식 위 표시) */
export function useNewsletterFollowUpdates(newsletterId: number) {
	const { user } = useAuth();
	return useQuery({
		queryKey: queryKeys.follows.updates(user?.id, newsletterId),
		queryFn: () => fetchFollowUpdatesIn(newsletterId),
		enabled: !!user,
	});
}

export function useFollowMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.follows.all });

	const follow = useMutation({
		mutationFn: followStory,
		onSuccess: () => showToast(FOLLOWS.followed, 'success'),
		onError: () => showToast(FOLLOWS.followFailed, 'error'),
		onSettled: refresh,
	});
	const unfollow = useMutation({
		mutationFn: unfollowStory,
		onSuccess: () => showToast(FOLLOWS.unfollowed, 'success'),
		onError: () => showToast(FOLLOWS.unfollowFailed, 'error'),
		onSettled: refresh,
	});
	// newsletterId가 있으면 그 뉴스레터 상세에서 본 후속만
	const markSeen = useMutation({
		mutationFn: (newsletterId?: number) => markFollowsSeen(newsletterId),
		onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.follows.all }),
	});
	const keep = useMutation({
		mutationFn: keepFollow,
		onSuccess: () => showToast(FOLLOWS.kept, 'success'),
		onError: () => showToast(COMMON.retryLater, 'error'),
		onSettled: refresh,
	});
	return { follow, unfollow, markSeen, keep };
}
