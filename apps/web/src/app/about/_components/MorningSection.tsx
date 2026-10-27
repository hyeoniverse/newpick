'use client';

import { useState } from 'react';
import styled from 'styled-components';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/**
 * 서버 예약 작업 순서 그대로: 08:00 수집 → 08:30 AI 편집(고르기 → 쓰기) → 08:40 발송.
 * from → to는 그 단계를 지나는 동안 시계가 흘러가는 분 (스크롤에 맞춰 08:00 → 08:40)
 */
const STEPS = [
	{ from: 0, to: 30, title: '기사 모으기', text: '6개 관심사의 그날 기사가 쏟아져 들어옵니다.' },
	{
		from: 30,
		to: 30,
		title: '중요한 소식 고르기',
		text: '같은 사건은 한 묶음으로. AI가 제목과 첫 부분만 읽고 그날 중요한 소식을 고릅니다.',
	},
	{
		from: 30,
		to: 40,
		title: '뉴스레터 쓰기',
		text: '고른 소식만 다시 읽고 요약 · 시사점 · 문답을 씁니다.',
	},
	{ from: 40, to: 40, title: '내 메일 한 통', text: '내 관심사를 엮어 한 통으로. 출근길에 한 번 읽으면 끝.' },
];

const CATEGORIES = ['IT', '정치', '경제', '사회', '생활', '세계'];

/** 같은 사건 묶음의 자리 (무대 안 %). 0 · 2 · 3번 묶음이 뽑힌다 */
const CLUSTERS = [
	{ x: 22, y: 30 },
	{ x: 52, y: 18 },
	{ x: 78, y: 34 },
	{ x: 36, y: 72 },
	{ x: 70, y: 74 },
];
const PICKED = [0, 2, 3];

/**
 * 기사 카드 16장. 단계마다 자리(phase 0~3)를 미리 정해 두고, 단계가 바뀌면 CSS 전환으로 옮겨 간다.
 * 흩어진 자리는 고정된 의사 난수라 서버·클라이언트가 같다
 */
const CARDS = Array.from({ length: 16 }, (_, i) => {
	const cluster = i % CLUSTERS.length;
	const k = Math.floor(i / CLUSTERS.length); // 묶음 안 순서
	const row = PICKED.indexOf(cluster);
	return {
		category: CATEGORIES[(i * 7) % CATEGORIES.length],
		width: 70 + ((i * 37) % 30), // 제목 줄 길이 %
		picked: row >= 0,
		// 0: 흩어짐
		x0: 14 + ((i * 53) % 72),
		y0: 10 + ((i * 31 + 7) % 78),
		r0: ((i * 29) % 25) - 12,
		// 1: 사건별 묶음 (조금씩 어긋나게 겹침)
		x1: CLUSTERS[cluster].x + k * 1.5,
		y1: CLUSTERS[cluster].y + k * 3,
		r1: (k - 1) * 3,
		// 2: 뉴스레터 한 장의 줄 (뽑힌 묶음만)
		y2: row >= 0 ? 28 + row * 22 + k * 0.8 : CLUSTERS[cluster].y,
	};
});

const toClock = (minute: number) => `08:${String(Math.round(minute)).padStart(2, '0')}`;

/**
 * 스크롤 시퀀스 (붙는 장면): 장면이 화면에 붙어 있는 동안 스크롤하면 시계가 08:00 → 08:40으로 흐르고,
 * 한 무대 위의 기사 카드들이 흩어짐 → 사건별 묶음 → 뉴스레터 한 장 → 봉투 속 메일로 이어서 바뀐다
 */
export default function MorningSection() {
	const [state, setState] = useState({ active: 0, minute: 0 });
	const ref = useScrollProgress<HTMLDivElement>('pinned', (progress) => {
		const scaled = progress * STEPS.length;
		const active = Math.min(STEPS.length - 1, Math.floor(scaled));
		const { from, to } = STEPS[active];
		const minute = Math.round(from + (to - from) * Math.min(1, scaled - active));
		setState((prev) => (prev.active === active && prev.minute === minute ? prev : { active, minute }));
	});
	const { active, minute } = state;

	return (
		<StyledMorning aria-label="뉴스레터가 만들어지는 아침" style={{ '--steps': STEPS.length } as React.CSSProperties}>
			<SectionHeading
				label="08:00 → 08:40"
				title="뉴스레터가 만들어지는 아침 40분."
				sub="기사를 모으고, 고르고, 쓰고, 보내기까지. 스크롤하며 따라가 보세요."
			/>

			<div ref={ref} className="track">
				<div className="scene" data-phase={active}>
					<p className="time" aria-hidden>
						{toClock(minute)}
					</p>

					<div className="stage" aria-hidden>
						{/* 3단계에 깔리는 뉴스레터 한 장 */}
						<div className="sheet">
							<span className="sheet-title">오늘의 뉴픽</span>
						</div>
						{PICKED.map((c, row) => (
							<span key={c} className="sheet-lines" style={{ '--row': row } as React.CSSProperties}>
								<span />
								<span />
							</span>
						))}

						{CARDS.map((card, i) => (
							<span
								key={i}
								className={card.picked ? 'card picked' : 'card'}
								style={
									{
										'--i': i,
										'--x0': `${card.x0}%`,
										'--y0': `${card.y0}%`,
										'--r0': `${card.r0}deg`,
										'--x1': `${card.x1}%`,
										'--y1': `${card.y1}%`,
										'--r1': `${card.r1}deg`,
										'--y2': `${card.y2}%`,
										'--w': `${card.width}%`,
									} as React.CSSProperties
								}
							>
								<span className="chip">{card.category}</span>
								<span className="headline" />
							</span>
						))}

						{/* 4단계: 봉투 */}
						<div className="envelope">
							<span className="flap" />
							<span className="stamp">08:40</span>
							<span className="to">오늘의 뉴픽 · 내 관심사</span>
						</div>
					</div>

					<ol className="captions">
						{STEPS.map((step, i) => (
							<li
								key={step.title}
								className="caption"
								data-active={i === active}
								aria-current={i === active ? 'step' : undefined}
							>
								<span className="no">
									{String(i + 1).padStart(2, '0')} <span className="of">/ {String(STEPS.length).padStart(2, '0')}</span>
								</span>
								<h3>{step.title}</h3>
								<p>{step.text}</p>
							</li>
						))}
					</ol>
				</div>
			</div>
		</StyledMorning>
	);
}

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

const StyledMorning = styled.section`
	/* 장면이 붙어 있는 구간. 높이 = 단계 수 × 80vh라 단계마다 한 화면쯤 스크롤한다 */
	.track {
		--progress: 0;
		position: relative;
		height: calc(var(--steps) * 80vh);
	}

	/* 시계는 왼쪽 위, 설명은 왼쪽 아래, 무대는 오른쪽을 넓게 (모바일은 시계 → 무대 → 설명) */
	.scene {
		position: sticky;
		top: 4rem;
		display: grid;
		grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
		grid-template-rows: auto 1fr auto;
		column-gap: 3rem;
		height: calc(100vh - 4rem);
		height: calc(100svh - 4rem);
		padding: 2rem 0 3rem;
		word-break: keep-all;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			padding: 1rem 0 1.5rem;
		}
	}

	.time {
		grid-column: 1;
		grid-row: 1;
		margin: 0;
		font-size: clamp(3.5rem, 9vw, 7rem);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.04em;
		/* 넓은 화면에서 '08:' / '00'으로 줄바꿈되지 않게 */
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.text};
	}

	.stage {
		position: relative;
		grid-column: 2;
		grid-row: 1 / -1;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-column: 1;
			grid-row: 2;
			margin: 1rem 0;
		}
	}

	/* ---------- 기사 카드 ---------- */
	.card {
		--x: var(--x0);
		--y: var(--y0);
		--r: var(--r0);
		--s: 1;
		position: absolute;
		left: var(--x);
		top: var(--y);
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 9.5rem;
		padding: 0.625rem 0.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		transform: translate(-50%, -50%) rotate(var(--r)) scale(var(--s));
		transition:
			left 0.9s ${EASE},
			top 0.9s ${EASE},
			transform 0.9s ${EASE},
			width 0.9s ${EASE},
			opacity 0.6s ease,
			border-color 0.4s ease;
		transition-delay: calc(var(--i) * 18ms);

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			width: 6.5rem;
			padding: 0.5rem;
		}

		.chip {
			align-self: flex-start;
			padding: 0 0.375rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			font-size: 0.6875rem;
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 10%, transparent);
		}

		.headline {
			width: var(--w);
			height: 0.4375rem;
			border-radius: 0.25rem;
			background: ${({ theme }) => theme.color.border};
		}
	}

	/* 1: 사건별 묶음. 뽑힌 묶음은 주 색 테두리, 나머지는 흐리게 */
	.scene[data-phase='1'] .card {
		--x: var(--x1);
		--y: var(--y1);
		--r: var(--r1);
		opacity: 0.3;

		&.picked {
			opacity: 1;
			border-color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 2: 뽑힌 카드만 가운데 한 장의 줄로, 나머지는 사라진다 */
	.scene[data-phase='2'] .card {
		--x: var(--x1);
		--y: var(--y1);
		--r: 0deg;
		--s: 0.7;
		opacity: 0;

		/* 뽑힌 카드는 뉴스레터 줄 너비로 넓어진다 */
		&.picked {
			--x: 50%;
			--y: var(--y2);
			--s: 1;
			width: min(20rem, 68%);
			opacity: 1;
			border-color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 3: 모두 봉투 속으로 */
	.scene[data-phase='3'] .card {
		--x: 50%;
		--y: 55%;
		--r: 0deg;
		--s: 0.3;
		opacity: 0;
	}

	/* ---------- 뉴스레터 한 장 ---------- */
	.sheet {
		position: absolute;
		left: 50%;
		top: 50%;
		width: min(24rem, 80%);
		height: 84%;
		padding: 1.25rem 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};
		opacity: 0;
		transform: translate(-50%, -46%) scale(0.96);
		transition:
			opacity 0.6s ease,
			transform 0.9s ${EASE};

		.sheet-title {
			display: block;
			padding-bottom: 0.75rem;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}
	}

	/* 뉴스레터 줄: 카드 바로 아래로 글줄이 써진다 */
	.sheet-lines {
		position: absolute;
		left: 50%;
		top: calc((28% + var(--row) * 22%) + 2.75rem);
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		width: min(20rem, 68%);
		transform: translateX(-50%);

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			top: calc((28% + var(--row) * 22%) + 2.25rem);
		}

		span {
			height: 0.3125rem;
			border-radius: 0.25rem;
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 30%, transparent);
			transform: scaleX(0);
			transform-origin: left;
			transition: transform 0.7s ease;
			transition-delay: calc(0.6s + var(--row) * 0.2s);

			&:last-child {
				width: 65%;
			}
		}
	}

	.scene[data-phase='2'] .sheet-lines span {
		transform: scaleX(1);
	}

	.scene[data-phase='2'] .sheet {
		opacity: 1;
		transform: translate(-50%, -50%);
	}

	.scene[data-phase='3'] .sheet {
		opacity: 0;
		transform: translate(-50%, -30%) scale(0.4);
	}

	/* ---------- 봉투 ---------- */
	.envelope {
		position: absolute;
		left: 50%;
		top: 55%;
		width: min(20rem, 76%);
		aspect-ratio: 16 / 10;
		border: 1px solid ${({ theme }) => theme.color.primary};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		overflow: hidden;
		opacity: 0;
		transform: translate(-50%, -30%) scale(0.9);
		transition:
			opacity 0.5s ease 0.35s,
			transform 0.8s ${EASE} 0.35s;

		/* 덮개: 위쪽 삼각형 */
		.flap {
			position: absolute;
			inset: 0 0 auto 0;
			height: 55%;
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 10%, transparent);
			clip-path: polygon(0 0, 100% 0, 50% 100%);
		}

		.stamp {
			position: absolute;
			right: 0.75rem;
			top: 0.75rem;
			padding: 0.125rem 0.5rem;
			border: 1px solid ${({ theme }) => theme.color.primary};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: 800;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};
		}

		.to {
			position: absolute;
			left: 1rem;
			bottom: 0.875rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
		}
	}

	.scene[data-phase='3'] .envelope {
		opacity: 1;
		transform: translate(-50%, -50%);
	}

	/* ---------- 설명 (왼쪽 아래) ---------- */
	.captions {
		grid-column: 1;
		grid-row: 3;
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.caption {
		grid-area: 1 / 1;
		opacity: 0;
		transform: translateY(0.75rem);
		transition:
			opacity 0.35s ease,
			transform 0.5s ${EASE};

		&[data-active='true'] {
			opacity: 1;
			transform: none;
		}

		.no {
			display: block;
			margin-bottom: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: 800;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};

			.of {
				color: ${({ theme }) => theme.color.subText};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			}
		}

		h3 {
			margin: 0 0 0.5rem;
			font-size: clamp(1.25rem, 2.2vw, 1.75rem);
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}

		p {
			margin: 0;
			line-height: 1.7;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card,
		.sheet,
		.sheet-lines span,
		.envelope,
		.caption {
			transition: none;
		}
	}
`;
