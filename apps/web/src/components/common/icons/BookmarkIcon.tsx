'use client';

import { LuBookmark } from 'react-icons/lu';
import { IconStyled } from '@/styles/Icon';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/useToast'; // Toast 훅 (필요 시)
import { useTheme } from 'styled-components';
import { useAddBookmarkMutation, useBookmarksList, useRemoveBookmarkMutation } from '@/hooks/useBookmark';

interface BookmarkIconProps {
	newsId: number;  // 아티클 ID
	newsletterId: number;
	className?: string;
}

export default function BookmarkIcon({ newsId, className, newsletterId }: BookmarkIconProps) {
	const theme = useTheme();
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
		} catch (error: any) {
			showToast(error.message || '북마크 설정에 실패했습니다.', 'error');
		}
	};

	return (
		<IconStyled onClick={handleToggle} className={className}>
			<LuBookmark
				style={{
					fill: isBookmarked ? theme.color.primary : '',
				}}
				size={24}
			/>
		</IconStyled>
	);
}
