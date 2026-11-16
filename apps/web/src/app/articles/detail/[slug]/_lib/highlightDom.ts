import type { Highlight } from '@newpick/shared';
import { findTextRange } from '@/utils/textRange';

/* 본문 형광펜 · 고르기의 DOM 계산 (#198). 화면 상태와 상관없는 순수 함수 */

/** 고른 글의 자리: 문서 기준 좌표 (화면이 아니라). 팝오버가 글에 붙어 함께 스크롤된다 */
export type Box = { left: number; top: number; bottom: number; width: number };

/** 화면 좌표 → 문서 좌표 (연 순간의 스크롤 위치를 더해 둔다) */
export const onPage = (rect: DOMRect, scroll = { x: window.scrollX, y: window.scrollY }): Box => ({
	left: rect.left + scroll.x,
	top: rect.top + scroll.y,
	bottom: rect.bottom + scroll.y,
	width: rect.width,
});

/** 칠할 띠 하나 (본문 기준 위치) */
export type Band = { id: number; note: boolean; left: number; top: number; width: number; height: number };
/** 줄 상자(글꼴 높이의 약 1.2배)에서 글자가 실제로 차지하는 부분: 위 12%를 비우고 78%만 */
const BAND_TOP = 0.12;
const BAND_HEIGHT = 0.78;

/**
 * 문장 하나의 띠들: 줄 상자마다 하나, 글자가 실제로 차지하는 가운데만. base는 띠 층의 화면 위치.
 * 브라우저 기본 칠하기(::highlight · 배경)는 글꼴의 줄 상자 높이를 따라가서 글꼴 · 크기 · 굵기가 다른 곳마다
 * 띠가 글자보다 위아래로 남거나 잘린다. 가운데 부분만 칠해 어디서나 같은 모양으로 맞춘다
 */
export function bandsOf(
	highlight: Pick<Highlight, 'id' | 'note'>,
	rects: Iterable<Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>>,
	base: Pick<DOMRect, 'left' | 'top'>,
): Band[] {
	const out: Band[] = [];
	for (const rect of rects) {
		if (rect.width < 1 || rect.height < 1) continue;
		out.push({
			id: highlight.id,
			note: Boolean(highlight.note),
			left: rect.left - base.left,
			top: rect.top - base.top + rect.height * BAND_TOP,
			width: rect.width,
			height: rect.height * BAND_HEIGHT,
		});
	}
	return out;
}

/** 띠가 그대로인지 (0.5px 안의 차이는 같다고 본다): 크기 · 글꼴 감지로 자주 불려도 다시 그리지 않게 */
export const sameBands = (a: Band[], b: Band[]) =>
	a.length === b.length &&
	a.every(
		(x, i) =>
			x.id === b[i].id &&
			x.note === b[i].note &&
			Math.abs(x.left - b[i].left) < 0.5 &&
			Math.abs(x.top - b[i].top) < 0.5 &&
			Math.abs(x.width - b[i].width) < 0.5 &&
			Math.abs(x.height - b[i].height) < 0.5,
	);

/** 본문 안 위치의 구역: 브리핑 · 소식 N (방문 통계 구역 이름과 같게) */
export function sectionOf(root: HTMLElement, node: Node | null) {
	const el = node instanceof Element ? node : node?.parentElement;
	const briefing = el?.closest('.briefing');
	if (briefing && root.contains(briefing)) return 'briefing';
	const story = el?.closest('.story');
	if (!story || !root.contains(story)) return undefined;
	return `story-${Array.from(root.querySelectorAll('.story')).indexOf(story) + 1}`;
}

/** 저장한 문장이 지금 본문의 어디에 있는지: 그 구역 안에서 먼저 찾고, 없으면 본문 전체에서 */
export function rangeOf(root: HTMLElement, highlight: Pick<Highlight, 'section' | 'text'>) {
	if (highlight.section) {
		const story = highlight.section.match(/^story-(\d+)$/);
		const scope =
			highlight.section === 'briefing'
				? root.querySelector('.briefing')
				: story
					? root.querySelectorAll('.story')[Number(story[1]) - 1]
					: null;
		const found = scope && findTextRange(scope, highlight.text);
		if (found) return found;
	}
	return findTextRange(root, highlight.text);
}

/** 누른 곳의 글자 위치 (크롬 · 사파리 / 파이어폭스) */
export function caretAt(x: number, y: number): { node: Node; offset: number } | null {
	const doc = document as Document & {
		caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
	};
	const position = doc.caretPositionFromPoint?.(x, y);
	if (position) return { node: position.offsetNode, offset: position.offset };
	const range = document.caretRangeFromPoint?.(x, y);
	return range ? { node: range.startContainer, offset: range.startOffset } : null;
}
