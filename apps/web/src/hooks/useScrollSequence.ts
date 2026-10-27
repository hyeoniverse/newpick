'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 스크롤 시퀀스: 단계 목록이 화면 가운데를 지날 때마다 지금 단계를 바꾸고,
 * 목록을 얼마나 지나왔는지(0~1)를 CSS 변수 --progress로 container에 적는다.
 * 진행도는 스크롤마다 바뀌므로 React 상태가 아니라 style에 바로 써서 다시 그리지 않는다
 *
 * @example
 * const { containerRef, stepRef, active } = useScrollSequence(STEPS.length);
 * <ol ref={containerRef}>{STEPS.map((s, i) => <li ref={stepRef(i)} data-active={i === active} />)}</ol>
 */
export function useScrollSequence<C extends HTMLElement = HTMLElement, S extends HTMLElement = HTMLElement>(
	count: number,
) {
	const containerRef = useRef<C>(null);
	const steps = useRef<(S | null)[]>([]);
	const [active, setActive] = useState(0);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// 화면 가운데 가로줄에 걸친 단계가 지금 단계
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const index = steps.current.indexOf(entry.target as S);
					if (index >= 0) setActive(index);
				}
			},
			{ rootMargin: '-50% 0px -50% 0px' },
		);
		steps.current.slice(0, count).forEach((el) => el && observer.observe(el));

		let frame = 0;
		const update = () => {
			frame = 0;
			const rect = container.getBoundingClientRect();
			const middle = window.innerHeight / 2;
			const progress = Math.min(1, Math.max(0, (middle - rect.top) / rect.height));
			container.style.setProperty('--progress', progress.toFixed(4));
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);

		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			cancelAnimationFrame(frame);
		};
	}, [count]);

	const stepRef = (index: number) => (el: S | null) => {
		steps.current[index] = el;
	};

	return { containerRef, stepRef, active };
}
