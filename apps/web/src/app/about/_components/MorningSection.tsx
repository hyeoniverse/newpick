'use client';

import styled, { keyframes } from 'styled-components';
import { LuNewspaper, LuLayers, LuPenLine, LuMailOpen } from 'react-icons/lu';
import BorderTitle from '@/components/common/BorderTitle';
import { useScrollSequence } from '@/hooks/useScrollSequence';

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
 * 스크롤 시퀀스: 오른쪽 단계를 내려가는 동안 왼쪽 시계 판이 따라 붙어 지금 시각과 단계를 보여 주고,
 * 단계 옆 세로줄이 지나온 만큼 채워진다. 좁은 화면은 시계 판 없이 세로줄과 단계만
 */
export default function MorningSection() {
	const { containerRef, stepRef, active } = useScrollSequence<HTMLDivElement, HTMLLIElement>(STEPS.length);
	const current = STEPS[active];

	return (
		<StyledMorning aria-label="뉴스레터가 만들어지는 아침">
			<BorderTitle text="08:00 → 08:40" />
			<p className="sub-text">아침 8시부터 40분 동안, 뉴스레터는 이렇게 만들어집니다.</p>

			<div className="layout">
				<div className="panel" aria-hidden>
					<div className="clock">
						<span className="time" key={active}>
							{current.time}
						</span>
						<span className="step-no">
							{String(active + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
						</span>
					</div>
					<div className="dots">
						{STEPS.map((step, i) => (
							<span key={step.title} className={i <= active ? 'dot on' : 'dot'} />
						))}
					</div>
					<current.icon className="panel-icon" key={`icon-${active}`} />
				</div>

				<div ref={containerRef} className="steps">
					<span className="track" aria-hidden>
						<span className="fill" />
					</span>
					<ol>
					{STEPS.map((step, i) => (
						<li key={step.title} ref={stepRef(i)} className="step" data-active={i === active}>
							<span className="marker" aria-hidden>
								<step.icon />
							</span>
							<p className="step-time">{step.time}</p>
							<h3 className="step-title">{step.title}</h3>
							<p className="step-text">{step.text}</p>
						</li>
					))}
					</ol>
				</div>
			</div>
		</StyledMorning>
	);
}

const tick = keyframes`
	from { opacity: 0; transform: translateY(0.75rem); }
	to { opacity: 1; transform: none; }
`;

const StyledMorning = styled.section`
	.sub-text {
		margin: -1.5rem 0 3rem;
		line-height: 1.8;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
		gap: 4rem;
		align-items: start;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
		}
	}

	/* 왼쪽: 스크롤하는 동안 화면에 붙어 있는 시계 판 */
	.panel {
		position: sticky;
		top: 7rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 2.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		color: ${({ theme }) => theme.color.primary};
		background: ${({ theme }) => theme.color.surface};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			display: none;
		}
	}

	.clock {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;

		.time {
			font-size: clamp(3rem, 6vw, 4.5rem);
			font-weight: 800;
			line-height: 1;
			font-variant-numeric: tabular-nums;
			animation: ${tick} 0.45s cubic-bezier(0.22, 1, 0.36, 1);
		}

		.step-no {
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.dots {
		display: flex;
		gap: 0.375rem;

		.dot {
			flex: 1;
			height: 0.25rem;
			border-radius: 0.125rem;
			background: ${({ theme }) => theme.color.border};
			transition: background 0.3s ease;

			&.on {
				background: currentColor;
			}
		}
	}

	.panel-icon {
		align-self: flex-end;
		width: 5rem;
		height: 5rem;
		opacity: 0.9;
		animation: ${tick} 0.45s cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* 오른쪽: 단계 목록. 세로줄은 지나온 만큼(--progress) 채워진다 */
	.steps {
		--progress: 0;
		position: relative;
		padding-left: 3.5rem;

		ol {
			display: flex;
			flex-direction: column;
			margin: 0;
			padding: 0;
			list-style: none;
		}
	}

	.track {
		position: absolute;
		left: 1.25rem;
		top: 1.25rem;
		bottom: 1.25rem;
		width: 2px;
		background: ${({ theme }) => theme.color.border};

		.fill {
			display: block;
			width: 100%;
			height: 100%;
			background: ${({ theme }) => theme.color.primary};
			transform-origin: top;
			transform: scaleY(var(--progress));
		}
	}

	.step {
		position: relative;
		min-height: 40vh;
		padding: 0.25rem 0 3rem;
		opacity: 0.35;
		transition: opacity 0.35s ease;

		&[data-active='true'] {
			opacity: 1;

			.marker {
				color: #ffffff;
				background: ${({ theme }) => theme.color.primary};
				border-color: ${({ theme }) => theme.color.primary};
				transform: scale(1.1);
			}
		}

		&:last-child {
			min-height: auto;
			padding-bottom: 0;
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			min-height: auto;
			padding-bottom: 2.5rem;
		}
	}

	.marker {
		position: absolute;
		left: -3.5rem;
		top: 0;
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 2px solid ${({ theme }) => theme.color.border};
		border-radius: 50%;
		color: ${({ theme }) => theme.color.subText};
		background: ${({ theme }) => theme.color.background};
		transition:
			background 0.3s ease,
			color 0.3s ease,
			border-color 0.3s ease,
			transform 0.3s ease;
	}

	.step-time {
		margin: 0 0 0.25rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.primary};
	}

	.step-title {
		margin: 0 0 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.large};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
	}

	.step-text {
		margin: 0;
		max-width: 32rem;
		line-height: 1.8;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	@media (prefers-reduced-motion: reduce) {
		.clock .time,
		.panel-icon {
			animation: none;
		}

		.step,
		.marker,
		.dot {
			transition: none;
		}
	}
`;
