'use client';

import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { LuNewspaper, LuLayers, LuPenLine, LuMailOpen } from 'react-icons/lu';
import BorderTitle from '@/components/common/BorderTitle';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/** 서버 예약 작업 순서 그대로: 08:00 수집 → 08:30 AI 편집(고르기 → 쓰기) → 08:40 발송 */
const STEPS = [
	{
		time: '08:00',
		icon: LuNewspaper,
		title: '기사 모으기',
		text: 'IT · 정치 · 경제 · 사회 · 생활 · 세계, 6개 관심사의 그날 기사를 모읍니다.',
	},
	{
		time: '08:30',
		icon: LuLayers,
		title: '중요한 소식 고르기',
		text: '제목이 비슷한 기사는 한 사건으로 묶고, AI가 제목과 첫 부분만 읽어 그날 중요한 소식을 고릅니다.',
	},
	{
		time: '08:30',
		icon: LuPenLine,
		title: '뉴스레터 쓰기',
		text: '고른 소식의 기사만 다시 읽고 요약 · 시사점 · 문답을 씁니다. 두 단계로 나눠 비용은 줄이고 깊이는 지켰습니다.',
	},
	{
		time: '08:40',
		icon: LuMailOpen,
		title: '내 메일 한 통',
		text: '구독한 관심사의 뉴스레터를 엮어 한 통으로 보냅니다. 출근길에 한 번 읽으면 끝.',
	},
];

/**
 * 스크롤 시퀀스 (붙는 장면): 섹션이 화면에 붙어 있는 동안 스크롤하면 시각·단계가 차례로 바뀌고
 * 아래 진행 막대가 채워진다. 섹션 높이 = 단계 수 × 80vh라 단계마다 한 화면쯤 스크롤한다
 */
export default function MorningSection() {
	const [active, setActive] = useState(0);
	const ref = useScrollProgress<HTMLDivElement>('pinned', (progress) => {
		const next = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
		setActive((prev) => (prev === next ? prev : next));
	});

	return (
		<StyledMorning aria-label="뉴스레터가 만들어지는 아침" style={{ '--steps': STEPS.length } as React.CSSProperties}>
			<BorderTitle text="08:00 → 08:40" />
			<div ref={ref} className="track">
				<div className="scene">
					<p className="eyebrow">매일 아침 40분</p>
					<p className="time" key={`time-${active}`} aria-hidden>
						{STEPS[active].time}
					</p>

					<ol className="steps">
						{STEPS.map((step, i) => (
							<li
								key={step.title}
								className="step"
								data-active={i === active}
								aria-current={i === active ? 'step' : undefined}
							>
								<step.icon className="icon" aria-hidden />
								<h3>{step.title}</h3>
								<p>{step.text}</p>
							</li>
						))}
					</ol>

					<div className="progress" aria-hidden>
						{STEPS.map((step, i) => (
							<span key={step.title} className={i <= active ? 'seg on' : 'seg'}>
								<span className="seg-label">{step.time}</span>
							</span>
						))}
					</div>
				</div>
			</div>
		</StyledMorning>
	);
}

const tick = keyframes`
	from { opacity: 0; transform: translateY(1rem); }
	to { opacity: 1; transform: none; }
`;

const StyledMorning = styled.section`
	/* 장면이 붙어 있는 구간. 높이 = 단계 수 × 80vh라 단계마다 한 화면쯤 스크롤한다 */
	.track {
		--progress: 0;
		position: relative;
		height: calc(var(--steps) * 80vh);
	}

	/* 화면에 붙어 있는 장면 (헤더 높이만큼 아래) */
	.scene {
		position: sticky;
		top: 4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: calc(100vh - 4rem);
		height: calc(100svh - 4rem);
		text-align: center;
		word-break: keep-all;
	}

	.eyebrow {
		margin: 0 0 0.5rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		letter-spacing: 0.08em;
		color: ${({ theme }) => theme.color.primary};
	}

	.time {
		margin: 0 0 1.5rem;
		font-size: clamp(5rem, 17vw, 12rem);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.04em;
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.text};
		animation: ${tick} 0.5s cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* 단계는 같은 자리에 겹쳐 두고 지금 단계만 보인다 */
	.steps {
		display: grid;
		width: 100%;
		max-width: 36rem;
		min-height: 9.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.step {
		grid-area: 1 / 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0;
		transform: translateY(1rem);
		transition:
			opacity 0.4s ease,
			transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
		pointer-events: none;

		&[data-active='true'] {
			opacity: 1;
			transform: none;
			pointer-events: auto;
		}

		.icon {
			width: 1.75rem;
			height: 1.75rem;
			margin-bottom: 0.75rem;
			color: ${({ theme }) => theme.color.primary};
		}

		h3 {
			margin: 0 0 0.75rem;
			font-size: clamp(1.375rem, 2.6vw, 2rem);
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}

		p {
			margin: 0;
			line-height: 1.7;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 진행 막대: 지난 단계까지 채워짐 (BorderTitle의 .bar와 겹치지 않게 progress) */
	.progress {
		display: flex;
		gap: 0.5rem;
		width: 100%;
		max-width: 36rem;
		margin-top: 2.5rem;

		.seg {
			flex: 1;
			padding-top: 0.625rem;
			border-top: 3px solid ${({ theme }) => theme.color.border};
			transition: border-color 0.3s ease;

			&.on {
				border-color: ${({ theme }) => theme.color.primary};
			}
		}

		.seg-label {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.time {
			animation: none;
		}

		.step,
		.progress .seg {
			transition: none;
		}
	}
`;
