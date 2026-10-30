'use client';

import { useState } from 'react';
import { IconStyled } from '@/styles/Icon';
import { StarGlyph } from '@/components/common/icons/Glyphs';

interface Props {
	/** 중요 표시가 켜져 있는지 */
	pressed: boolean;
	onToggle: () => void;
	className?: string;
}

/**
 * 중요 표시 별 단추 (공통, 북마크 · 링크 복사 단추와 같은 동그란 아이콘 단추).
 * 가리키면 살짝 기울며 커지고 누를 때 일을 미리 보이고, 켜면 아래에서부터 보라가 차오르고 끄면 빠진다
 */
export default function StarToggle({ pressed, onToggle, className }: Props) {
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
			aria-label={pressed ? '중요 해제' : '중요 표시'}
			aria-pressed={pressed}
			title={pressed ? '중요 해제' : '중요 표시'}
		>
			<StarGlyph filled={pressed} />
		</IconStyled>
	);
}
