'use client';

import { LuBookmark } from 'react-icons/lu';
import { useTheme } from 'styled-components';
import { IconStyled } from '@/styles/Icon';

interface Props {
	pressed: boolean;
	onToggle: () => void;
	className?: string;
}

/**
 * 북마크 아이콘의 모양만 (눌림 여부·클릭). 저장은 하지 않는다.
 * 실제 저장은 BookmarkIcon이 이것을 감싸 API로 하고, /admin/ui는 이것만 보여 준다
 */
export default function BookmarkToggle({ pressed, onToggle, className }: Props) {
	const theme = useTheme();

	return (
		<IconStyled
			type="button"
			onClick={onToggle}
			className={className}
			aria-label={pressed ? '북마크 해제' : '북마크'}
			aria-pressed={pressed}
		>
			<LuBookmark style={{ fill: pressed ? theme.color.primary : '' }} size={24} />
		</IconStyled>
	);
}
