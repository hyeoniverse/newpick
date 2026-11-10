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
		onSuccess: () => showToast("후속이 나오면 마이페이지 '지켜보기'와 머리글에 표시합니다.", 'success'),
		onError: () => showToast('지켜보기를 시작하지 못했습니다. 잠시 후 다시 시도해 주십시오.', 'error'),
		onSettled: refresh,
	});
	const unfollow = useMutation({
		mutationFn: unfollowStory,
		onSuccess: () => showToast('지켜보기를 그만두었습니다.', 'success'),
		onError: () => showToast('지켜보기를 끄지 못했습니다. 잠시 후 다시 시도해 주십시오.', 'error'),
		onSettled: refresh,
	});
	// newsletterId가 있으면 그 뉴스레터 상세에서 본 후속만
	const markSeen = useMutation({
		mutationFn: (newsletterId?: number) => markFollowsSeen(newsletterId),
		onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.follows.all }),
	});
	const keep = useMutation({
		mutationFn: keepFollow,
		onSuccess: () => showToast('계속 지켜봅니다. 30일 뒤 다시 확인합니다.', 'success'),
		onError: () => showToast('잠시 후 다시 시도해 주십시오.', 'error'),
		onSettled: refresh,
	});
	return { follow, unfollow, markSeen, keep };
}
