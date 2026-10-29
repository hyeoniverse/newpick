'use client';

import { IconStyled } from '@/styles/Icon';
import { BookmarkGlyph } from '@/components/common/icons/Glyphs';

interface Props {
	pressed: boolean;
	onToggle: () => void;
	className?: string;
}

/**
 * 북마크 아이콘의 모양만 (눌림 여부·클릭). 저장은 하지 않는다.
 * 켜면 위에서부터 색이 차오르고, 끄면 그 색이 빠진다 (떠오르는 움직임은 없음).
 * 실제 저장은 BookmarkIcon이 이것을 감싸 API로 하고, /admin/ui는 이것만 보여 준다
 */
export default function BookmarkToggle({ pressed, onToggle, className }: Props) {
	return (
		<IconStyled
			onClick={onToggle}
			className={className}
			aria-label={pressed ? '북마크 해제' : '북마크'}
			aria-pressed={pressed}
		>
			<BookmarkGlyph filled={pressed} />
		</IconStyled>
	);
}
