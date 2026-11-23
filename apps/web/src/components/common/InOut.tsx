'use client';

import { useRef } from 'react';
import { type InOutPart, useInOut } from '@/hooks/useInOut';

/** 칸 이름 (styles/pages/home.css .np-io, 차례로 나타날 것을 고르는 데 쓴다) */
export type InOutKind = 'lines' | 'personal' | 'trend' | 'continuing' | 'threads' | 'topics' | 'popular' | 'subscribe';

/**
 * 칸마다 움직일 것과 모양 (styles/pages/home.css [data-io-item=…]). 차례는 모두 화면 높이 순서(위에서 아래로),
 * 움직임은 칸마다 다르다
 */
const PARTS: Record<InOutKind, InOutPart[]> = {
	// 어두운 띠가 위에서 아래로 펼쳐지고, 줄은 흐릿했다가 또렷해지며 내려앉는다
	lines: [
		[':has(> [data-track-section="home-today-lines"])', 'unroll'],
		['li', 'focus'],
	],
	// 목록이 위에서 아래로 접혔다 펴지듯 열린다
	personal: [['.grid > div > *', 'unfold']],
	// 카드가 위쪽 모서리를 축으로 넘어오며 내려온다 (줄마다, 왼쪽부터 도미노처럼)
	trend: [
		['.trend-header', 'settle'],
		['.trend-cards > *', 'flap'],
	],
	// 날짜 축 표: 날짜가 왼쪽부터 차례로 나오고, 사건 줄마다(위에서 아래로) 실선이 왼쪽에서 오른쪽으로 그어지며 그날 소식이 하나씩 나온다
	continuing: [
		['[role="columnheader"]', 'step'],
		['[role="rowheader"]', 'settle'],
		['[role="cell"] > span[aria-hidden]', 'trace'],
		['[role="cell"] > a', 'step'],
	],
	// 잇는 세로선이 위에서 아래로 그어지고, 점이 차례로 찍힌다
	threads: [
		['article', 'settle'],
		['article li', 'line'],
		['article li > span:first-child', 'dot'],
	],
	// 큰 사진이 위에서 아래로 닦이며 확대에서 제 크기로, 목록은 내려앉는다
	topics: [
		['.grid > div:first-child', 'reveal'],
		['ul > li', 'settle'],
	],
	// 태그가 위에서 비처럼 떨어져 튕기며 자리 잡고, 순위 숫자는 툭 떨어진다
	popular: [
		['.grid > div > h3, .grid > div > p', 'settle'],
		['ul > li', 'rain'],
		['ol > li', 'settle'],
		['ol > li a > span:first-child', 'thud'],
	],
	// 칸 전체는 판으로 아래에서 올라오고(StackPanel), 그 안의 카드가 왼쪽부터 차례로 내려앉는다
	subscribe: [
		['.cards > .card', 'cascade'],
		['.subscription-form', 'settle'],
	],
};

/**
 * 스크롤해서 화면에 들어오면 등장, 벗어나면 퇴장하는 칸 (useInOut). 서버 칸을 그대로 감싼다.
 * 모든 칸이 위에서 아래로 흐르되(칸 제목 → 위 줄 → 아래 줄), 움직임은 칸마다 다르다 (PARTS).
 * 칸이 그려지지 않으면(로그인 전 '나를 위한 소식' 등) 빈 상자로 남는다
 */
export default function InOut({ kind, children }: { kind: InOutKind; children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	useInOut(ref, PARTS[kind]);
	return (
		<div ref={ref} className="np-io" data-io={kind}>
			{children}
		</div>
	);
}
