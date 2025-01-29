// 'use client';
//
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import {
//   addBookmarkAPI,
//   removeBookmarkAPI,
//   fetchUserBookmarks,
//   BookmarkItem,
// } from '@/services/bookmarkService';
// import { useBookmarkStore } from '@/stores/useBookmarkStore';
//
// // 북마크 목록
// export function useBookmarksQuery(userId?: number) {
//   const { setBookmarks } = useBookmarkStore();
//   const queryClient = useQueryClient();
//
//   return useQuery<BookmarkItem[]>({
//     queryKey: [ 'bookmarks', userId ],
//     queryFn: () => fetchUserBookmarks(),
//     enabled: !!userId,
//     placeholderData: [],
//     onSuccess: (data: BookmarkItem[]) => {
//       const newsIds = data.map((item) => item.newsId);
//       setBookmarks(newsIds);
//     },
//   });
// }
//
// // 북마크 추가
// export function useAddBookmarkMutation() {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: async ({ userId, newsId }: { userId: number; newsId: number }) => {
//       return addBookmarkAPI(userId, newsId);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [ 'bookmarks' ] });
//     },
//   });
// }
//
// // 북마크 삭제
// export function useRemoveBookmarkMutation() {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     // v4 문법
//     mutationFn: async ({ userId, newsId }: { userId: number; newsId: number }) => {
//       return removeBookmarkAPI(userId, newsId);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [ 'bookmarks' ] });
//     },
//   });
// }
