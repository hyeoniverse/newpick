'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Highlight } from '@newpick/shared';
import { bandsOf, rangeOf, sameBands, type Band } from '../../../_lib/highlightDom';

/**
 * 형광펜 칠하기 (#123, #198): 저장한 문장마다 지금 본문에서 범위를 찾아 줄별 띠를 만든다.
 * 본문 HTML이 늦게 들어오거나 바뀌면, 사진이 늦게 떠 줄 위치가 바뀌면, 글꼴을 받으면 다시 칠한다.
 * 마이페이지에서 '원문에서 보기'로 오면(?hl=번호) 그 문장으로 스크롤하고 잠깐(2.4초) 진하게
 * 돌려주는 ranges: 스크랩 번호 → 지금 본문의 범위 (누른 곳이 어느 스크랩인지 찾을 때)
 */
export function useHighlightBands(rootRef: React.RefObject<HTMLElement | null>, highlights: Highlight[]) {
	const searchParams = useSearchParams();
	const ranges = useRef(new Map<number, Range>());
	const scrolledTo = useRef<number | null>(null);
	const layerRef = useRef<HTMLDivElement>(null);
	const [bands, setBands] = useState<Band[]>([]);
	const [focusId, setFocusId] = useState<number | null>(null);

	useEffect(() => {
		const root = rootRef.current;
		const layer = layerRef.current;
		if (!root || !layer) return;
		const paint = () => {
			ranges.current.clear();
			const base = layer.getBoundingClientRect();
			const next: Band[] = [];
			for (const highlight of highlights) {
				const range = rangeOf(root, highlight);
				if (!range) continue;
				ranges.current.set(highlight.id, range);
				next.push(...bandsOf(highlight, Array.from(range.getClientRects()), base));
			}
			// 띠가 그대로면 상태를 바꾸지 않는다 (크기 · 글꼴 감지로 자주 불려도 다시 그리지 않게)
			setBands((prev) => (sameBands(prev, next) ? prev : next));

			// 마이페이지에서 고른 문장으로
			const target = Number(searchParams.get('hl'));
			const range = target ? ranges.current.get(target) : undefined;
			if (range && scrolledTo.current !== target) {
				scrolledTo.current = target;
				const rect = range.getBoundingClientRect();
				window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3, behavior: 'smooth' });
				setFocusId(target);
				window.setTimeout(() => setFocusId(null), 2400);
			}
		};
		paint();
		const mutations = new MutationObserver(paint);
		mutations.observe(root, { childList: true, subtree: true, characterData: true });
		const resize = new ResizeObserver(paint);
		resize.observe(root);
		document.fonts?.ready.then(paint).catch(() => {});
		return () => {
			mutations.disconnect();
			resize.disconnect();
		};
	}, [highlights, rootRef, searchParams]);

	return { layerRef, bands, focusId, ranges };
}
