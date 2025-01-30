import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IBookmarkItem } from '@/models/bookmark.model';
import {
  fetchUserBookmarksApi,
  addBookmarkApi,
  removeBookmarkApi,
} from '@/api/bookmark';
import { useCookie } from '@/hooks/useCookie';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/useToast';

// 북마크 목록 조회
export function useBookmarksList() {
  const { getAuthCookies } = useCookie();
  const { token, userId } = getAuthCookies();
  const toast = useToast();

  return useQuery<IBookmarkItem[]>({
    queryKey: ['myBookmarks'],
    queryFn: async () => {
      if (!token) throw new Error('No token found');
      return fetchUserBookmarksApi();
    },
    enabled: !!token && !!userId,
  });
}

// 북마크 추가
export function useAddBookmarkMutation() {
  const { getAuthCookies } = useCookie();
  const { token } = getAuthCookies();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newsId: number) => {
      if (!token) throw new Error('No token found');
      return addBookmarkApi(token, newsId);
    },
    onSuccess: () => {
      // 성공 시, 북마크 목록 invalidate
      queryClient.invalidateQueries(['myBookmarks']);
    },
  });
}

// 북마크 삭제
export function useRemoveBookmarkMutation() {
  const { getAuthCookies } = useCookie();
  const { token } = getAuthCookies();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newsId: number) => {
      if (!token) throw new Error('No token found');
      return removeBookmarkApi(token, newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myBookmarks']);
    },
  });
}
