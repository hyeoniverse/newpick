'use client';

import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { LuNewspaper, LuLayers, LuPenLine, LuMailOpen, LuCheck } from 'react-icons/lu';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/**
 * 서버 예약 작업 순서 그대로: 08:00 수집 → 08:30 AI 편집(고르기 → 쓰기) → 08:40 발송.
 * from → to는 그 단계를 지나는 동안 시계가 흘러가는 분 (스크롤에 맞춰 08:00 → 08:40)
 */
const STEPS = [
	{
		from: 0,
		to: 30,
		icon: LuNewspaper,
		title: '기사 모으기',
		text: 'IT · 정치 · 경제 · 사회 · 생활 · 세계, 6개 관심사의 그날 기사를 모읍니다.',
	},
	{
		from: 30,
		to: 30,
		icon: LuLayers,
		title: '중요한 소식 고르기',
		text: '제목이 비슷한 기사는 한 사건으로 묶고, AI가 제목과 첫 부분만 읽어 그날 중요한 소식을 고릅니다.',
	},
	{
		from: 30,
		to: 40,
		icon: LuPenLine,
		title: '뉴스레터 쓰기',
		text: '고른 소식의 기사만 다시 읽고 요약 · 시사점 · 문답을 씁니다. 두 단계로 나눠 비용은 줄이고 깊이는 지켰습니다.',
	},
	{
		from: 40,
		to: 40,
		icon: LuMailOpen,
		title: '내 메일 한 통',
		text: '구독한 관심사의 뉴스레터를 엮어 한 통으로 보냅니다. 출근길에 한 번 읽으면 끝.',
	},
];

const CATEGORIES = ['IT', '정치', '경제', '사회', '생활', '세계'];

/** 단계마다 오른쪽 판에 보이는 그림 (장식) */
function Visual({ index }: { index: number }) {
	if (index === 0)
		return (
			<div className="v-collect">
				<div className="chips">
					{CATEGORIES.map((c, i) => (
						<span key={c} className="chip" style={{ '--i': i } as React.CSSProperties}>
							{c}
						</span>
					))}
				</div>
				<div className="articles">
					{Array.from({ length: 9 }, (_, i) => (
						<span key={i} className="article" style={{ '--i': i } as React.CSSProperties} />
					))}
				</div>
			</div>
		);

	if (index === 1)
		return (
			<ul className="v-pick">
				{[true, false, true, false, false].map((picked, i) => (
					<li key={i} className={picked ? 'row picked' : 'row'} style={{ '--i': i } as React.CSSProperties}>
						<span className="check">{picked && <LuCheck />}</span>
						<span className="line" />
						{i === 0 && <span className="tag">같은 사건 묶음</span>}
					</li>
				))}
			</ul>
		);

	if (index === 2)
		return (
			<div className="v-write">
				{['요약', '시사점', '문답'].map((label, i) => (
					<div key={label} className="block" style={{ '--i': i } as React.CSSProperties}>
						<span className="label">{label}</span>
						<span className="line" />
						<span className="line short" />
					</div>
				))}
			</div>
		);

	return (
		<div className="v-mail">
			<div className="mail-head">
				<span className="from">NEWPICK</span>
				<span className="at">08:40</span>
			</div>
			<p className="subject">오늘의 뉴픽 · IT · 경제 · 세계</p>
			{[0, 1, 2].map((i) => (
				<div key={i} className="story" style={{ '--i': i } as React.CSSProperties}>
					<span className="dot" />
					<span className="line" />
				</div>
			))}
		</div>
	);
}

const toClock = (minute: number) => `08:${String(Math.round(minute)).padStart(2, '0')}`;

/**
 * 스크롤 시퀀스 (붙는 장면): 장면이 화면에 붙어 있는 동안 스크롤하면
 * 시계가 08:00 → 08:40으로 흐르고, 단계 글·오른쪽 그림이 바뀌며, 아래 선이 이어서 채워진다
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
				<div className="scene">
					<div className="main">
						<div className="copy">
							<p className="time" aria-hidden>
								{toClock(minute)}
							</p>
							<ol className="steps">
								{STEPS.map((step, i) => (
									<li
										key={step.title}
										className="step"
										data-active={i === active}
										aria-current={i === active ? 'step' : undefined}
									>
										<span className="step-no">
											<step.icon aria-hidden /> {String(i + 1).padStart(2, '0')}
										</span>
										<h3>{step.title}</h3>
										<p>{step.text}</p>
									</li>
								))}
							</ol>
						</div>

						<div className="panel" aria-hidden>
							{STEPS.map((step, i) => (
								<div key={step.title} className="visual" data-active={i === active}>
									<Visual index={i} />
								</div>
							))}
						</div>
					</div>

					{/* 이어진 선: 지나온 만큼 채워지고, 지난 단계 점은 주 색 */}
					<div className="pipeline" aria-hidden>
						<span className="rail">
							<span className="fill" />
						</span>
						{STEPS.map((step, i) => (
							<span
								key={step.title}
								className={i <= active ? 'node on' : 'node'}
								style={{ '--at': i / (STEPS.length - 1) } as React.CSSProperties}
							>
								<span className="node-label">{step.title}</span>
							</span>
						))}
					</div>
				</div>
			</div>
		</StyledMorning>
	);
}

const appear = keyframes`
	from { opacity: 0; transform: translateY(0.75rem); }
	to { opacity: 1; transform: none; }
`;

const grow = keyframes`
	from { transform: scaleX(0); }
	to { transform: scaleX(1); }
`;

const StyledMorning = styled.section`
	/* 장면이 붙어 있는 구간. 높이 = 단계 수 × 75vh라 단계마다 한 화면쯤 스크롤한다 */
	.track {
		--progress: 0;
		position: relative;
		height: calc(var(--steps) * 75vh);
	}

	.scene {
		position: sticky;
		top: 4rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 3rem;
		height: calc(100vh - 4rem);
		height: calc(100svh - 4rem);
		word-break: keep-all;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			gap: 1.5rem;
		}
	}

	.main {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: center;
		gap: 4rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}
	}

	.time {
		margin: 0 0 1.5rem;
		font-size: clamp(4rem, 11vw, 8.5rem);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.04em;
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.text};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			margin-bottom: 0.75rem;
		}
	}

	/* 단계 글은 같은 자리에 겹쳐 두고 지금 단계만 보인다 */
	.steps {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.step {
		grid-area: 1 / 1;
		opacity: 0;
		transform: translateY(0.75rem);
		transition:
			opacity 0.35s ease,
			transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
		pointer-events: none;

		&[data-active='true'] {
			opacity: 1;
			transform: none;
			pointer-events: auto;
		}

		.step-no {
			display: inline-flex;
			align-items: center;
			gap: 0.375rem;
			margin-bottom: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};
		}

		h3 {
			margin: 0 0 0.625rem;
			font-size: clamp(1.375rem, 2.6vw, 2rem);
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}

		p {
			margin: 0;
			max-width: 30rem;
			line-height: 1.7;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 오른쪽 판: 단계 그림을 겹쳐 두고 바꿔 보여 준다 */
	.panel {
		display: grid;
		aspect-ratio: 4 / 3;
		padding: 2rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			order: -1;
			aspect-ratio: auto;
			height: 11rem;
			padding: 1.25rem;
			overflow: hidden;
		}
	}

	.visual {
		grid-area: 1 / 1;
		display: grid;
		align-content: center;
		opacity: 0;
		transition: opacity 0.35s ease;

		&[data-active='true'] {
			opacity: 1;
		}

		/* 지금 단계 그림 안의 조각들이 차례로 들어온다 */
		&[data-active='true'] [style*='--i'] {
			animation: ${appear} 0.45s ease both;
			animation-delay: calc(var(--i) * 0.07s);
		}
	}

	.line {
		display: block;
		height: 0.5rem;
		border-radius: 0.25rem;
		background: ${({ theme }) => theme.color.border};

		&.short {
			width: 60%;
		}
	}

	.v-collect {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;

		.chips {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.chip {
			padding: 0.25rem 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.primary};
			border-radius: ${({ theme }) => theme.radius.chip};
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.background};
		}

		.articles {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.5rem;

			@media ${({ theme }) => theme.mediaQuery.tablet} {
				.article:nth-child(n + 4) {
					display: none;
				}
			}
		}

		.article {
			height: 2.5rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.surface};
			background: ${({ theme }) => theme.color.background};
		}
	}

	.v-pick {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		margin: 0;
		padding: 0;
		list-style: none;

		.row {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.625rem 0.875rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.surface};
			background: ${({ theme }) => theme.color.background};
			opacity: 0.45;

			.line {
				flex: 1;
			}

			&.picked {
				border-color: ${({ theme }) => theme.color.primary};
				opacity: 1;

				.line {
					background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 35%, transparent);
				}
			}

			@media ${({ theme }) => theme.mediaQuery.tablet} {
				padding: 0.375rem 0.75rem;

				&:nth-child(n + 4) {
					display: none;
				}
			}
		}

		.check {
			display: grid;
			place-items: center;
			flex-shrink: 0;
			width: 1.25rem;
			height: 1.25rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			color: #ffffff;

			.picked & {
				border-color: ${({ theme }) => theme.color.primary};
				background: ${({ theme }) => theme.color.primary};
			}
		}

		.tag {
			flex-shrink: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.v-write {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			gap: 0.5rem;
			padding: 0.75rem 1rem;

			.block:nth-child(3) {
				display: none;
			}
		}

		.block {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
		}

		.label {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
		}

		.line {
			transform-origin: left;
		}
	}

	/* 쓰기 단계: 글줄이 왼쪽부터 그어진다 */
	.visual[data-active='true'] .v-write .line {
		animation: ${grow} 0.6s ease both;
		animation-delay: 0.25s;
	}

	.v-mail {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			gap: 0.5rem;
			padding: 0.75rem 1rem;

			.story:nth-child(n + 5) {
				display: none;
			}
		}

		.mail-head {
			display: flex;
			justify-content: space-between;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};

			.from {
				font-weight: 800;
				color: ${({ theme }) => theme.color.primary};
			}
		}

		.subject {
			margin: 0;
			padding-bottom: 0.75rem;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
		}

		.story {
			display: flex;
			align-items: center;
			gap: 0.75rem;

			.dot {
				flex-shrink: 0;
				width: 0.5rem;
				height: 0.5rem;
				border-radius: 50%;
				background: ${({ theme }) => theme.color.primary};
			}

			.line {
				flex: 1;
			}
		}
	}

	/* 이어진 선: 점 사이를 지나온 만큼 채운다 (progress × 단계 수 / (단계 수 - 1)) */
	.pipeline {
		position: relative;
		height: 3.5rem;
		margin: 0 3rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			margin: 0 1.5rem;
		}

		.rail {
			position: absolute;
			left: 0;
			right: 0;
			top: 0.5rem;
			height: 2px;
			background: ${({ theme }) => theme.color.border};
		}

		.fill {
			display: block;
			width: min(100%, calc(var(--progress) * var(--steps) / (var(--steps) - 1) * 100%));
			height: 100%;
			background: ${({ theme }) => theme.color.primary};
		}

		.node {
			position: absolute;
			top: 0;
			left: calc(var(--at) * 100%);
			display: flex;
			flex-direction: column;
			align-items: center;
			transform: translateX(-50%);

			&::before {
				content: '';
				width: 1rem;
				height: 1rem;
				border: 2px solid ${({ theme }) => theme.color.border};
				border-radius: 50%;
				background: ${({ theme }) => theme.color.background};
				transition:
					border-color 0.3s ease,
					background 0.3s ease;
			}

			&.on::before {
				border-color: ${({ theme }) => theme.color.primary};
				background: ${({ theme }) => theme.color.primary};
			}
		}

		.node-label {
			margin-top: 0.5rem;
			white-space: nowrap;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.subText};

			.on & {
				color: ${({ theme }) => theme.color.text};
			}

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				display: none;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.step,
		.visual,
		.pipeline .node::before {
			transition: none;
		}

		.visual[data-active='true'] [style*='--i'],
		.visual[data-active='true'] .v-write .line {
			animation: none;
		}
	}
`;
