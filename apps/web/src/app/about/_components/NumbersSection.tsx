'use client';

import { useEffect, useRef, useState } from 'react';
import SectionHeading from '@/app/about/_components/SectionHeading';

/** 숫자는 서비스 설정에서 온 값이다 (관심사 6개, 하루 한 통, 08:40 발송, AI 2단계, 무료) */
const NUMBERS = [
	{ value: 6, unit: '개 관심사', text: 'IT · 정치 · 경제 · 사회 · 생활 · 세계' },
	{ value: 1, unit: '통', text: '고른 관심사를 엮어 하루에 한 통' },
	{ value: 40, unit: '', text: '매일 아침 8시 40분 발송', format: (n: number) => `08:${String(n).padStart(2, '0')}` },
	{ value: 2, unit: '단계', text: 'AI가 고르고, 다시 읽고 쓰기' },
	{ value: 0, unit: '원', text: '열람 · 구독 · 북마크 모두 무료' },
];

const DURATION_MS = 1200;

/** 화면에 들어오면 0부터 목표 숫자까지 올라간다 (움직임 줄이기면 바로 목표 숫자) */
function useCountUp(target: number, start: boolean) {
	const [value, setValue] = useState(target);

	useEffect(() => {
		if (!start || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let frame = 0;
		const begin = performance.now();
		const tick = (now: number) => {
			const t = Math.min(1, (now - begin) / DURATION_MS);
			const eased = 1 - Math.pow(1 - t, 3);
			setValue(Math.round(target * eased));
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [target, start]);

	return value;
}

function NumberItem({ value, unit, text, format, start }: (typeof NUMBERS)[number] & { start: boolean }) {
	const current = useCountUp(value, start);
	return (
		<li className="item">
			<p className="value">
				<strong>{format ? format(current) : current}</strong>
				{unit && <span className="unit">{unit}</span>}
			</p>
			<p className="text">{text}</p>
		</li>
	);
}

export default function NumbersSection() {
	const ref = useRef<HTMLUListElement>(null);
	const [start, setStart] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				setStart(true);
				observer.disconnect();
			},
			{ rootMargin: '0px 0px -15% 0px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<section
			className="np-about-numbers-section-numbers"
			data-track-section="about-numbers"
			id="about-numbers"
			aria-label="숫자로 보는 NEWPICK"
		>
			<SectionHeading label="IN NUMBERS" title="하루 한 통이면 충분해요" />
			<ul ref={ref} className="list">
				{NUMBERS.map((item) => (
					<NumberItem key={item.text} {...item} start={start} />
				))}
			</ul>
		</section>
	);
}
