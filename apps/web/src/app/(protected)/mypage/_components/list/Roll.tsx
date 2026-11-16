'use client';

import { useState } from 'react';

/**
 * 숫자판처럼 넘어가는 글자: 값이 바뀌면 이전 값은 빠져나가고 새 값이 같은 방향에서 들어온다.
 * from-below면 위로 넘어가고(아래에서 올라옴), from-above면 아래로 넘어간다
 */
export default function Roll({ value, enter, className = '' }: { value: string; enter: string; className?: string }) {
	const [current, setCurrent] = useState(value);
	const [previous, setPrevious] = useState<string | null>(null);
	const [turn, setTurn] = useState(0);
	if (current !== value) {
		setPrevious(current);
		setCurrent(value);
		setTurn((n) => n + 1);
	}
	return (
		<span className={`roll ${className}`}>
			<span key={`in-${turn}`} className={turn ? `roll-in ${enter}` : undefined}>
				{current}
			</span>
			{previous !== null && (
				<span key={`out-${turn}`} className={`roll-out ${enter}`} aria-hidden onAnimationEnd={() => setPrevious(null)}>
					{previous}
				</span>
			)}
		</span>
	);
}
