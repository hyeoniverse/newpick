import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IBookmarkItem } from '@/models/bookmark.model';
import { fetchUserBookmarksApi, addBookmarkApi, removeBookmarkApi } from '@/api/bookmark';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useToast } from '@/hooks/useToast';

interface BookmarkVariables {
	newsId: number;
	newsletterId: number;
}

// 북마크 목록 조회
export const useBookmarksList = () => {
	const { user } = useAuth();

	return useQuery<IBookmarkItem[]>({
		queryKey: ['bookmarks', user?.id],
		queryFn: async () => {
			return fetchUserBookmarksApi();
		},
		enabled: !!user,
	});
};

// 북마크 추가
export const useAddBookmarkMutation = () => {
	const { showToast } = useToast();
	const queryClient = useQueryClient();

	return useMutation<IBookmarkItem, Error, BookmarkVariables>({
		mutationFn: async ({ newsId, newsletterId }) => {
			return addBookmarkApi(newsId, newsletterId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
			queryClient.invalidateQueries({ queryKey: ['taste'] });
			showToast('북마크가 추가되었습니다.', 'success');
		},
	});
};

// 북마크 삭제
export const useRemoveBookmarkMutation = () => {
	const { showToast } = useToast();
	const queryClient = useQueryClient();

	return useMutation<{ success: boolean }, Error, BookmarkVariables>({
		mutationFn: async ({ newsId, newsletterId }) => {
			return removeBookmarkApi(newsId, newsletterId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
			queryClient.invalidateQueries({ queryKey: ['taste'] });
			showToast('북마크가 삭제되었습니다.', 'success');
		},
	});
};

/** 북마크 폴더 옮기기 (#123): 여러 개 한꺼번에도 */
export const useMoveBookmarksMutation = () => {
	const { showToast } = useToast();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ newsletterIds, folderId }: { newsletterIds: number[]; folderId: number | null }) =>
			apiFetch<{ count: number }>(API_ENDPOINTS.MY.BOOKMARKS_MOVE(), {
				method: 'POST',
				body: { newsletterIds, folderId },
			}),
		onSuccess: ({ count }) => {
			queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
			queryClient.invalidateQueries({ queryKey: ['folders'] });
			showToast(`${count}개를 옮겼어요.`, 'success');
		},
		onError: (error: Error) =>
			showToast(error instanceof ApiError ? error.message : '옮기지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'error'),
	});
};
