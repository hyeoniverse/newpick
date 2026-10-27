'use client';

import { useEffect, useRef } from 'react';
import styled from 'styled-components';

interface Props {
	children: React.ReactNode;
	className?: string;
	/** 섹션 안에서 따로 하나씩 나타날 요소 (CSS 선택자). 형제끼리는 조금씩 늦게 나타난다 */
	items?: string;
}

const STAGGER_MS = 90;
const MAX_STAGGER = 5;

/**
 * 스크롤해서 화면에 들어오면 아래에서 살짝 떠오르며 나타난다.
 * 바로 아래 자식(섹션)과 items에 맞는 요소가 대상이고, 한 번 나타나면 다시 숨지 않는다.
 * - 숨기는 class는 마운트 뒤에 붙여서, JS가 없거나 늦어도 내용은 보이고 서버·클라이언트 HTML도 같다
 * - 첫 화면에 이미 보이는 요소와 접힌(보이지 않는) 요소는 건드리지 않는다
 * - 움직임 줄이기를 켠 사용자에게는 움직이지 않는다
 */
export default function ScrollReveal({ children, className, items }: Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = ref.current;
		if (!root || !('IntersectionObserver' in window)) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const targets = [
			...Array.from(root.children),
			...(items ? Array.from(root.querySelectorAll(items)) : []),
		] as HTMLElement[];

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					entry.target.classList.add('is-revealed');
					observer.unobserve(entry.target);
				}
			},
			{ rootMargin: '0px 0px -10% 0px' },
		);

		// 나타난 뒤에는 class를 지워 원래 hover 전환·transform을 방해하지 않는다
		const cleanUp = (event: TransitionEvent) => {
			const el = event.currentTarget as HTMLElement;
			if (event.target !== el || event.propertyName !== 'transform' || !el.classList.contains('is-revealed')) return;
			el.classList.remove('reveal', 'is-revealed');
			el.style.transitionDelay = '';
			el.removeEventListener('transitionend', cleanUp);
		};

		for (const el of targets) {
			const rect = el.getBoundingClientRect();
			if (rect.height === 0 || rect.top < window.innerHeight) continue;

			const index = items && el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0;
			if (index > 0) el.style.transitionDelay = `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms`;
			el.classList.add('reveal');
			el.addEventListener('transitionend', cleanUp);
			observer.observe(el);
		}

		return () => observer.disconnect();
	}, [items]);

	return (
		<StyledReveal ref={ref} className={className}>
			{children}
		</StyledReveal>
	);
}

const StyledReveal = styled.div`
	.reveal {
		opacity: 0;
		transform: translateY(1.5rem);
		transition:
			opacity 0.6s ease,
			transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.reveal.is-revealed {
		opacity: 1;
		transform: none;
	}
`;
