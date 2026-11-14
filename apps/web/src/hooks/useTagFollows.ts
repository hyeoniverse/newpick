import { TAGS } from '@/copy';
import { queryKeys } from '@/api/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import { fetchTagFollows, followTag, unfollowTag } from '@/api/tagFollows';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export const TAG_FOLLOWS_KEY = queryKeys.tagFollows;

/** 팔로우한 태그 (#123): 목록 · 팔로우 · 끊기. 로그인했을 때만 불러온다 */
export function useTagFollows() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { data: follows = [], isPending } = useQuery({
		queryKey: TAG_FOLLOWS_KEY,
		queryFn: fetchTagFollows,
		enabled: !!user,
	});
	const refresh = () => queryClient.invalidateQueries({ queryKey: TAG_FOLLOWS_KEY });
	const follow = useMutation({
		mutationFn: followTag,
		onSuccess: ({ tag }) => showToast(TAGS.followed(tag), 'success'),
		// 오류 메시지는 API 문장 그대로 (예: 20개 넘음)
		onError: (error) => showToast(errorMessage(error, TAGS.followFailed), 'error'),
		onSettled: refresh,
	});
	const unfollow = useMutation({
		mutationFn: unfollowTag,
		onError: () => showToast(TAGS.unfollowFailed, 'error'),
		onSettled: refresh,
	});
	return {
		follows,
		isPending: !!user && isPending,
		isFollowing: (tag: string) => follows.some((f) => f.tag === tag),
		follow,
		unfollow,
	};
}
