'use client';

import { useState } from 'react';
import { IconStyled } from '@/styles/Icon';
import { BookmarkGlyph } from '@/components/common/icons/Glyphs';

interface Props {
	pressed: boolean;
	onToggle: () => void;
	className?: string;
}

/**
 * 북마크 아이콘의 모양만 (눌림 여부·클릭). 저장은 하지 않는다.
 * 켜면 위에서부터 색이 차오르고, 끄면 그 색이 빠진다. 가리키면 누를 때 일을 미리 보인다(빈 것은 위가 조금 차고, 찬 것은 아래가 조금 빠짐 — 실제로 차고 빠지는 방향과 같게) — 눌러 바뀐 뒤에는 나갔다 들어오기 전까지 미리 보기 없음.
 * 실제 저장은 BookmarkIcon이 이것을 감싸 API로 하고, /admin/ui는 이것만 보여 준다
 */
export default function BookmarkToggle({ pressed, onToggle, className }: Props) {
	// 방금 눌러 바뀌었으면 마우스가 나갔다 다시 들어오기 전까지 미리 보기를 멈춘다 (바뀐 상태 그대로 보이게)
	const [settled, setSettled] = useState(false);
	return (
		<IconStyled
			onClick={() => {
				setSettled(true);
				onToggle();
			}}
			onMouseLeave={() => setSettled(false)}
			onBlur={() => setSettled(false)}
			data-settled={settled || undefined}
			className={className}
			aria-label={pressed ? '북마크 해제' : '북마크'}
			aria-pressed={pressed}
		>
			<BookmarkGlyph filled={pressed} />
		</IconStyled>
	);
}
