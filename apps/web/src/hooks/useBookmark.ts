import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IBookmarkItem } from '@/models/bookmark.model';
import {
  fetchUserBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
} from '@/api/bookmark';
import { useToast } from '@/hooks/useToast';

interface BookmarkVariables {
  newsId: number;
  newsletterId: number;
}

// 북마크 목록 조회
export const useBookmarksList = () => {

  return useQuery<IBookmarkItem[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      return fetchUserBookmarksApi();
    },
  });
}

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
      showToast('북마크가 추가되었습니다.', 'success');
    },
  });
}

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
      showToast('북마크가 삭제되었습니다.', 'success');
    },
  });
}
