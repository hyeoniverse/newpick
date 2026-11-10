import { queryKeys } from '@/api/queryKeys';
import type { BookmarkPage } from '@newpick/shared';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IBookmarkItem } from '@/types/bookmark';
import {
	fetchUserBookmarksApi,
	addBookmarkApi,
	removeBookmarkApi,
	fetchBookmarkPage,
	moveBookmarks,
} from '@/api/bookmark';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage } from '@/api/client';
import { useToast } from '@/hooks/useToast';

interface BookmarkVariables {
	newsId: number;
	newsletterId: number;
}

// 북마크 목록 조회
export const useBookmarksList = () => {
	const { user } = useAuth();

	return useQuery<IBookmarkItem[]>({
		queryKey: queryKeys.bookmarks.list(user?.id),
		queryFn: async () => {
			return fetchUserBookmarksApi();
		},
		enabled: !!user,
	});
};

/** 마이페이지 북마크 한 쪽 (서버에서 거르고 정렬) */
/** 북마크 한 쪽 (@newpick/shared) */
export type { BookmarkPage };

/** 한 번에 받는 북마크 수 (카드 세 줄 × 여덟) */
export const BOOKMARK_PAGE_SIZE = 24;

/**
 * 마이페이지 북마크 (#123): 쪽 단위로 받아 '더 보기'로 이어 붙인다. 북마크가 많아도 처음엔 한 쪽만.
 * filters: 'folder=none&categoryId=3&sort=views' 같은 쿼리
 */
export const useBookmarkPages = (filters: string) => {
	const { user } = useAuth();
	return useInfiniteQuery({
		queryKey: queryKeys.bookmarks.page(user?.id, filters),
		queryFn: ({ pageParam }) => fetchBookmarkPage(pageParam, BOOKMARK_PAGE_SIZE, filters),
		initialPageParam: 0,
		getNextPageParam: (last, pages) => {
			const loaded = pages.reduce((n, p) => n + p.items.length, 0);
			return loaded < last.total ? loaded : undefined;
		},
		enabled: !!user,
		placeholderData: (previous) => previous,
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
			queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.taste.all });
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
			queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.taste.all });
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
			moveBookmarks(newsletterIds, folderId),
		onSuccess: ({ count }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
			showToast(`${count}개를 옮겼습니다.`, 'success');
		},
		onError: (error: Error) =>
			showToast(errorMessage(error, '옮기지 못했습니다. 잠시 뒤 다시 시도해 주십시오.'), 'error'),
	});
};
