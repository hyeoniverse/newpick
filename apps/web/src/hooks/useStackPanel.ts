import { useEffect } from 'react';

/** 다 사라질 때 패널이 줄어드는 정도 (1 → 0.9) */
const SHRINK = 0.1;
/**
 * 다음 판의 위 끝이 화면 위에서 이만큼(화면 높이 비율) 올라왔을 때 패널이 다 사라진다.
 * 판에 다 덮이는 때에 맞추면 사라지는 끝 모습이 판 밑에 가려져, 위쪽이 아직 보일 때 끝나게 한다
 */
const GONE_AT = 0.45;
/** 사라지는 동안 패널이 스크롤의 이만큼 속도로 위로 밀려 올라간다: 다음 판이 밀어 올리는 느낌으로, 멈춰 있을 때보다 빨리 빠져나간다 */
const LIFT = 0.3;

/**
 * 패널이 얼마나 사라졌는지 (0 ~ 1): 다음 판이 올라온 만큼, 화면 위에서 GONE_AT 지점에 닿으면 1.
 * @param scrolled 덮기 시작한 뒤 스크롤한 거리
 * @param distance 다 덮을 때까지의 스크롤 거리
 */
export const coverProgress = (scrolled: number, distance: number) =>
	distance > 0 ? Math.min(1, Math.max(0, scrolled / distance)) : 0;

/** 위에 붙는 머리글(3rem) · 속보 띠(--np-breaking-band) 아래 여유 (px) */
const BELOW_BARS = 16;

/**
 * 'bottom' 패널이 멈출 자리 (sticky top): 마지막 칸의 위 끝이 머리글 · 속보 띠 바로 아래까지 올라왔을 때.
 * 마지막 칸이 그 아래 공간보다 길면 아래 끝이 화면 아래에 닿을 때 (끝까지 본 뒤). 둘 가운데 더 늦은(더 많이 스크롤한) 쪽.
 * 아래 끝에서 멈추면 마지막 칸이 화면 아래에 걸린 채 덮여, 화면 가운데~위까지 올려 볼 수 없었다
 */
function bottomStop(el: HTMLElement) {
	const atBottom = window.innerHeight - el.offsetHeight;
	const last = el.lastElementChild as HTMLElement | null;
	if (!last) return atBottom;
	const band = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--np-breaking-band')) || 0;
	const bars = 48 + band + BELOW_BARS;
	return Math.min(atBottom, bars - last.offsetTop);
}

/**
 * 멈춰 있는 패널을 바로 다음 요소(판)가 아래에서 올라와 덮는다 (홈 첫 화면 · 구독 칸 위의 칸들).
 * 패널은 sticky로 멈추고, 판이 올라오는 만큼 스크롤보다 느리게 위로 밀려나며 작아지고 흐려지다가 판이 화면 중간쯤 왔을 때 다 사라진다 (움직임 줄이기 설정이면 흐려지기만, 움직이지 않는다).
 * @param stop 멈추는 자리
 *   - 'start': 스크롤하지 않았을 때의 자리 (첫 화면 패널: 처음부터 움직이지 않는다)
 *   - 'bottom': 마지막 칸이 머리글 · 속보 띠 바로 아래까지 올라왔을 때 (bottomStop). 덮기는 판이 화면 아래로 들어올 때부터 센다
 */
export function useStackPanel(ref: React.RefObject<HTMLElement | null>, stop: 'start' | 'bottom') {
	useEffect(() => {
		const el = ref.current;
		const cover = el?.nextElementSibling as HTMLElement | null;
		if (!el || !cover) return;
		const still = window.matchMedia('(prefers-reduced-motion: reduce)');
		// 덮기 시작 · 다 덮음의 스크롤 위치
		let from = 0;
		let to = 0;
		let frame = 0;

		const paint = () => {
			frame = 0;
			const p = coverProgress(window.scrollY - from, to - from);
			el.style.opacity = p ? String(1 - p) : '';
			el.style.transform =
				still.matches || p === 0 ? '' : `translateY(${-p * (to - from) * LIFT}px) scale(${1 - SHRINK * p})`;
		};
		const place = () => {
			// 멈추지 않았을 때의 자리를 잰다
			el.style.top = '';
			el.style.position = 'relative';
			const top = el.getBoundingClientRect().top + window.scrollY;
			el.style.position = '';
			const coverTop = cover.getBoundingClientRect().top + window.scrollY;
			const stick = stop === 'start' ? top : bottomStop(el);
			el.style.top = `${stick}px`;
			// 덮기 시작 = 첫 화면은 처음부터.
			// 다 사라짐 = 판이 화면 위에서 GONE_AT만큼 올라왔을 때 (패널 위쪽이 아직 보이는 동안 끝까지 흐려지는 모습이 보인다)
			// 긴 패널은 판이 패널의 보이는 아래 끝(멈춘 자리의 아래 끝, 화면 아래보다 아래로는 가지 않음)에 닿을 때부터
			from = stop === 'start' ? 0 : coverTop - Math.min(window.innerHeight, stick + el.offsetHeight);
			to = Math.max(from + 1, coverTop - window.innerHeight * GONE_AT);
			// 긴 패널은 화면에 보이는 부분의 가운데를 중심으로 작아진다 (전체 가운데면 보이는 아래쪽이 위로 끌려간다)
			if (stop === 'bottom') el.style.transformOrigin = `50% ${window.innerHeight / 2 - stick}px`;
			paint();
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(paint);
		};
		place();
		const observer = new ResizeObserver(place);
		observer.observe(el);
		window.addEventListener('resize', place);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(frame);
		};
	}, [ref, stop]);
}
