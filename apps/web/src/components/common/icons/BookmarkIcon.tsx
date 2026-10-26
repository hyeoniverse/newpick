'use client';

import BookmarkToggle from '@/components/common/icons/BookmarkToggle';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/useToast'; // Toast 훅 (필요 시)
import { useAddBookmarkMutation, useBookmarksList, useRemoveBookmarkMutation } from '@/hooks/useBookmark';

interface BookmarkIconProps {
	newsId: number; // 뉴스레터 ID
	newsletterId: number;
	className?: string;
}

/** 북마크 저장·해제 (API). 모양은 BookmarkToggle */
export default function BookmarkIcon({ newsId, className, newsletterId }: BookmarkIconProps) {
	const { user } = useAuthStore();
	const { data: bookmarks } = useBookmarksList();
	const addBookmarkMutation = useAddBookmarkMutation();
	const removeBookmarkMutation = useRemoveBookmarkMutation();
	const { showToast } = useToast();

	const isBookmarked = bookmarks?.some((b) => b.id === newsId);

	const handleToggle = async () => {
		if (!user) {
			showToast('로그인 후 이용해주세요.', 'error');
			return;
		}

		try {
			if (isBookmarked) {
				await removeBookmarkMutation.mutateAsync({ newsId, newsletterId });
			} else {
				await addBookmarkMutation.mutateAsync({ newsId, newsletterId });
			}
		} catch (error: unknown) {
			let errorMessage = '북마크 설정에 실패했습니다.';

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}

			showToast(errorMessage, 'error');
		}
	};

	return <BookmarkToggle pressed={!!isBookmarked} onToggle={handleToggle} className={className} />;
}
