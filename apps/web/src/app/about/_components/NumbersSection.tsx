'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

/** 숫자는 서비스 설정에서 온 값이다 (분야 6개, 하루 한 통, 08:40 발송, AI 2단계, 무료) */
const NUMBERS = [
	{ value: 6, unit: '개 분야', text: 'IT · 정치 · 경제 · 사회 · 생활 · 세계' },
	{ value: 1, unit: '통', text: '고른 분야를 엮어 하루에 한 통' },
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
		<StyledNumbers id="about-numbers" aria-label="숫자로 보는 NEWPICK">
			<p className="label">숫자로 보는 NEWPICK</p>
			<ul ref={ref} className="list">
				{NUMBERS.map((item) => (
					<NumberItem key={item.text} {...item} start={start} />
				))}
			</ul>
		</StyledNumbers>
	);
}

const StyledNumbers = styled.section`
	scroll-margin-top: 6rem;

	.label {
		margin: 0 0 1.5rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.subText};
	}

	.list {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid ${({ theme }) => theme.color.border};
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		@media ${({ theme }) => theme.mediaQuery.desktop} {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.item {
		padding: 1.75rem 1.25rem;
		border-left: 1px solid ${({ theme }) => theme.color.border};

		&:first-child {
			border-left: none;
			padding-left: 0;
		}

		@media ${({ theme }) => theme.mediaQuery.desktop} {
			border-left: none;
			padding: 1.25rem 0;
		}
	}

	.value {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		margin: 0 0 0.5rem;
		color: ${({ theme }) => theme.color.text};

		strong {
			font-size: clamp(2rem, 4vw, 2.75rem);
			font-weight: 800;
			line-height: 1;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};
		}

		.unit {
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}
	}

	.text {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.5;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}
`;
