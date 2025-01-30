import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IBookmarkItem } from '@/models/bookmark.model';
import {
  fetchUserBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
} from '@/api/bookmark';
import { useCookie } from '@/hooks/useCookie';
import { useToast } from '@/hooks/useToast';

// 북마크 목록 조회
export const useBookmarksList = () => {
  const { getAuthCookies } = useCookie();
  const { token, userId } = getAuthCookies();

  return useQuery<IBookmarkItem[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      if (!token) throw new Error('No token found');
      return fetchUserBookmarksApi();
    },
    enabled: !!token && !!userId,
  });
}

// 북마크 추가
export const useAddBookmarkMutation = () => {
  const { getAuthCookies } = useCookie();
  const { token } = getAuthCookies();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newsId: number) => {
      if (!token) throw new Error('No token found');
      return addBookmarkApi(newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      showToast('북마크가 추가되었습니다.', 'success');
    },
  });
}

// 북마크 삭제
export const useRemoveBookmarkMutation = () => {
  const { getAuthCookies } = useCookie();
  const { token } = getAuthCookies();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newsId: number) => {
      if (!token) throw new Error('No token found');
      return removeBookmarkApi(newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      showToast('북마크가 삭제되었습니다.', 'success');
    },
  });
}
