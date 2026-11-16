'use client';

import { useEffect, useState } from 'react';
import type { BarItem } from '../../_lib/months';

/**
 * 달 막대가 붙었는지 · 지금 보는 항목 (#198): 스크롤 · 창 크기 변경 때 살핀다.
 * - 붙음: 막대가 목록의 시작보다 아래에 와 있으면. 헤더가 나타나고 숨으며 막대가 움직이는 동안에도 이 관계는 그대로라
 *   너비가 줄었다 늘었다 하지 않는다 (예전엔 붙는 높이와 비교해 움직이는 0.3초 동안 풀렸다)
 * - 지금 보는 항목: 막대 아래 줄을 지난 마지막 항목 (붙어 있을 때만, 아니면 없음)
 * - 막대 높이를 목록에 알려(--bar-h) 달 · 날짜로 건너뛸 때 막대에 가리지 않게, 펼친 바탕 폭은 스크롤바를 뺀 화면 폭
 */
export function useStickyActive(
	ref: React.RefObject<HTMLDivElement | null>,
	groups: { month: string; items: BarItem[] }[],
	top: string,
) {
	const [stuck, setStuck] = useState(false);
	const [active, setActive] = useState<string | null>(null);
	// 펼친 바탕의 폭 = 스크롤바를 뺀 화면 폭 (100vw는 스크롤바만큼 넘쳐 가로 스크롤이 생긴다)
	const [pageWidth, setPageWidth] = useState(0);

	useEffect(() => {
		let timer = 0;
		const check = () => {
			const el = ref.current;
			if (!el) return;
			setPageWidth(document.documentElement.clientWidth);
			el.parentElement?.style.setProperty('--bar-h', `${el.offsetHeight}px`);
			const section = el.parentElement;
			const isStuck = !!section && el.getBoundingClientRect().top - section.getBoundingClientRect().top > 0.5;
			setStuck(isStuck);
			const barBottom = el.getBoundingClientRect().bottom;
			let current: string | null = null;
			if (isStuck) {
				for (const { id } of groups.flatMap((g) => g.items)) {
					const target = document.getElementById(id);
					if (target && target.getBoundingClientRect().top <= barBottom + 80) current = id;
				}
				current ??= groups[0].items[0]?.id ?? null;
			}
			setActive(current);
		};
		// 헤더가 나타나고 숨을 때 막대도 0.3초 움직이므로, 움직임이 끝난 뒤 한 번 더 본다
		const checkSoon = () => {
			check();
			window.clearTimeout(timer);
			timer = window.setTimeout(check, 350);
		};
		checkSoon();
		window.addEventListener('scroll', checkSoon, { passive: true });
		window.addEventListener('resize', checkSoon);
		return () => {
			window.clearTimeout(timer);
			window.removeEventListener('scroll', checkSoon);
			window.removeEventListener('resize', checkSoon);
		};
	}, [ref, top, groups]);

	return { stuck, active, pageWidth };
}
