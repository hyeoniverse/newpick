import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { fetchTagFollows, followTag, unfollowTag } from '@/api/tagFollows';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export const TAG_FOLLOWS_KEY = ['tag-follows'];

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
		onSuccess: ({ tag }) =>
			showToast(`#${tag} 태그를 팔로우했습니다. 다음 메일부터 이 태그의 소식을 앞에 보내드립니다.`, 'success'),
		// 오류 메시지는 API 문장 그대로 (예: 20개 넘음)
		onError: (error) =>
			showToast(
				error instanceof ApiError ? error.message : '팔로우하지 못했습니다. 잠시 후 다시 시도해 주세요.',
				'error',
			),
		onSettled: refresh,
	});
	const unfollow = useMutation({
		mutationFn: unfollowTag,
		onError: () => showToast('팔로우를 끊지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error'),
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
