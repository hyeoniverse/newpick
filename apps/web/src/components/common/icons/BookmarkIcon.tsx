'use client';

import { LuBookmark } from 'react-icons/lu';
import { IconStyled } from '@/styles/Icon';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBookmarkStore } from '@/stores/useBookmarkStore';
import { useToast } from '@/hooks/useToast'; // Toast 훅 (필요 시)
import { useTheme } from 'styled-components';

interface BookmarkIconProps {
	newsId: number;  // 아티클 ID
	className?: string;
}

export default function BookmarkIcon({ newsId, className }: BookmarkIconProps) {
	const theme = useTheme();
	const { user } = useAuthStore();
	const { bookmarks, toggleBookmark } = useBookmarkStore();
	const { showToast } = useToast();

	const isBookmarked = bookmarks.some((b) => b.newsId === newsId);

	const handleToggle = async () => {
		if (!user) {
			showToast('로그인 후 이용해주세요.', 'error');
			return;
		}

		try {
			await toggleBookmark(newsId);
			showToast(isBookmarked ? '북마크가 해제되었습니다.' : '북마크가 추가되었습니다.', 'success');
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
