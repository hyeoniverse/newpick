import { useEffect } from 'react';

/** 차례로 나타날 때 늦추는 단계의 최대 (그 뒤는 같은 때) */
const MAX_STEP = 8;
/** 같은 줄로 보는 높이 차이 (px): 한 줄에 놓인 카드 · 칸은 함께 나타난다 */
const ROW = 24;
/** 화면 위 · 아래에서 이만큼 안쪽 띠에 들어오면 등장, 벗어나면 퇴장 (벗어난 뒤에도 이 여백만큼은 보여서 퇴장이 보인다) */
const BAND = '-15% 0px -15% 0px';

/**
 * 칸 안에서 움직일 것: [CSS 선택자, 모양 이름(data-io-item 값), 보이는 영역(선택)].
 * 보이는 영역을 주면 그 안에(가로로) 놓인 것만 움직인다: 슬라이더의 다음 페이지처럼 가려진 것이 지나가는 모습이 보이지 않게
 */
export type InOutPart = [selector: string, role: string, within?: string];

/**
 * 화면 높이 순서로 차례 매기기: 위에 있는 것이 먼저, 같은 줄(높이 차이 ROW 안)은 같은 차례.
 * 형제 순서가 아니라 실제 놓인 높이라, 칸이 여러 단이어도 위에서 아래로 흐른다
 */
export function rowSteps(tops: number[]) {
	const rows: number[] = [];
	for (const top of [...tops].sort((a, b) => a - b))
		if (!rows.length || top - rows[rows.length - 1] > ROW) rows.push(top);
	return tops.map((top) => Math.min(rows.filter((row) => row <= top + ROW / 2).length - 1, MAX_STEP));
}

/**
 * 스크롤 등장 · 퇴장 (홈 칸들). 표시를 달기만 하고, 모양은 CSS가 정한다 (styles/pages/home.css .np-io · .np-try):
 * - data-armed: 숨겨 둘 수 있음 (그린 뒤에 단다: JS가 없거나 늦어도 내용은 보이고, 서버 · 브라우저 HTML이 같다)
 * - data-shown: 화면 가운데 띠에 들어옴 → 등장
 * - data-leaving: 띠를 벗어남 (아직 일부는 보임) → 퇴장
 * - 화면 밖으로 완전히 나가면 둘 다 지워 다시 숨긴 채로 둔다 → 다시 들어오면 처음부터 등장
 * 움직임 줄이기 설정이면 아무것도 달지 않는다 (늘 보임).
 * @param parts 칸 안에서 움직일 것과 그 모양. data-io-item(모양)과 차례를 단다: --n 높이 차례(같은 줄은 같음) · --c 같은 줄 안 왼쪽부터 순서.
 *   나중에 그려진 것도 등장할 때마다 다시 단다
 */
export function useInOut(ref: React.RefObject<HTMLElement | null>, parts: InOutPart[] = []) {
	useEffect(() => {
		const el = ref.current;
		if (!el || !('IntersectionObserver' in window)) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const mark = () => {
			const targets = parts.flatMap(([selector, role, within]) =>
				[...el.querySelectorAll<HTMLElement>(selector)].flatMap((item) => {
					const box = item.getBoundingClientRect();
					const area = within ? item.closest(within)?.getBoundingClientRect() : undefined;
					if (area && (box.left >= area.right - 1 || box.right <= area.left + 1)) {
						// 보이는 영역 밖: 움직이지 않고 그대로 둔다
						delete item.dataset.ioItem;
						return [];
					}
					return [{ item, role, box }];
				}),
			);
			const steps = rowSteps(targets.map((t) => t.box.top));
			targets.forEach(({ item, role, box }, i) => {
				const column = targets.filter((t, j) => steps[j] === steps[i] && t.box.left < box.left).length;
				item.dataset.ioItem = role;
				item.style.setProperty('--n', String(steps[i]));
				item.style.setProperty('--c', String(Math.min(column, MAX_STEP)));
			});
		};
		mark();
		el.dataset.armed = '';

		const band = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					if (!('leaving' in el.dataset)) mark();
					delete el.dataset.leaving;
					el.dataset.shown = '';
				} else if ('shown' in el.dataset) {
					delete el.dataset.shown;
					el.dataset.leaving = '';
				}
			},
			{ rootMargin: BAND },
		);
		const view = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) return;
			delete el.dataset.shown;
			delete el.dataset.leaving;
		});
		band.observe(el);
		view.observe(el);
		return () => {
			band.disconnect();
			view.disconnect();
		};
		// parts는 칸마다 고정된 상수
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ref]);
}
