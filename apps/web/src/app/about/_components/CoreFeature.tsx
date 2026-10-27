'use client';

import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import SectionHeading from '@/app/about/_components/SectionHeading';

const CATEGORIES = ['IT', '정치', '경제', '사회', '생활', '세계'];

/** AI 큐레이션: 소식 한 꼭지가 요약 · 시사점 · 문답으로 써지고, 중요한 구절에 형광펜 */
function CurationDemo() {
	return (
		<div className="demo curation">
			<span className="chip">IT</span>
			<span className="title" />
			{['요약', '시사점', '문답'].map((label, i) => (
				<div key={label} className="part" style={{ '--i': i } as React.CSSProperties}>
					<span className="label">{label}</span>
					<span className="text">
						<span className="ink" />
						{i === 0 && <span className="mark" />}
					</span>
					<span className="text short">
						<span className="ink" />
					</span>
				</div>
			))}
		</div>
	);
}

/** 맞춤 구독: 관심사 칩이 하나씩 켜진다 (IT · 경제 · 세계) */
function SubscribeDemo() {
	const on = [0, 2, 5];
	return (
		<div className="demo subscribe">
			<div className="chips">
				{CATEGORIES.map((c, i) => (
					<span
						key={c}
						className={on.includes(i) ? 'chip-toggle on' : 'chip-toggle'}
						style={{ '--o': on.indexOf(i) } as React.CSSProperties}
					>
						{c}
					</span>
				))}
			</div>
			<p className="count">
				관심사 <strong>3개</strong>를 골랐어요
			</p>
		</div>
	);
}

/** 자동 발송: 메일함 맨 위로 08:40 오늘의 뉴픽이 도착한다 */
function SendDemo() {
	return (
		<div className="demo send">
			<div className="mail new">
				<span className="dot" />
				<span className="from">NEWPICK</span>
				<span className="subject">오늘의 뉴픽 · 관심사 3개</span>
				<span className="at">08:40</span>
			</div>
			{[0, 1, 2].map((i) => (
				<div key={i} className="mail old" style={{ '--i': i } as React.CSSProperties}>
					<span className="from-bar" />
					<span className="subject-bar" />
				</div>
			))}
		</div>
	);
}

const FEATURES = [
	{
		title: 'AI 큐레이션',
		text: '방대한 기사 중 필요한 정보만 추출하고, 요약 · 시사점 · 문답으로 정리합니다.',
		Demo: CurationDemo,
	},
	{ title: '맞춤 구독', text: '원하는 관심사만 골라 구독합니다. 여러 개를 골라도 메일은 한 통.', Demo: SubscribeDemo },
	{ title: '자동 발송', text: '매일 아침 8시 40분, 따로 찾아보지 않아도 메일함에 도착합니다.', Demo: SendDemo },
];

/** 한 줄: 화면에 들어오면 data-inview가 켜지고 그때부터 오른쪽 장면이 움직인다 */
function FeatureRow({ index, title, text, Demo }: (typeof FEATURES)[number] & { index: number }) {
	const ref = useRef<HTMLLIElement>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				setInView(true);
				observer.disconnect();
			},
			{ rootMargin: '0px 0px -25% 0px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<li ref={ref} className="row" data-inview={inView}>
			<div className="copy">
				<span className="no">{String(index + 1).padStart(2, '0')}</span>
				<h3>{title}</h3>
				<p>{text}</p>
			</div>
			<div className="stage" aria-hidden>
				<Demo />
			</div>
		</li>
	);
}

/** 핵심 기능: 기능마다 넓은 한 줄. 왼쪽 큰 이름 · 설명, 오른쪽 지금 디자인으로 그린 작은 장면 */
export default function CoreFeature() {
	return (
		<StyledCore>
			<SectionHeading label="CORE FEATURE" title="읽을 것만, 읽기 좋게." />
			<ol className="rows">
				{FEATURES.map((feature, i) => (
					<FeatureRow key={feature.title} index={i} {...feature} />
				))}
			</ol>
		</StyledCore>
	);
}

const write = keyframes`
	from { transform: scaleX(0); }
	to { transform: scaleX(1); }
`;

const appear = keyframes`
	from { opacity: 0; transform: translateY(0.5rem); }
	to { opacity: 1; transform: none; }
`;

const turnOn = keyframes`
	to {
		color: var(--on-fg);
		background: var(--on-bg);
		border-color: var(--on-bg);
	}
`;

const arrive = keyframes`
	0% { opacity: 0; transform: translateY(-1.25rem); }
	60% { opacity: 1; transform: translateY(0.125rem); }
	100% { opacity: 1; transform: none; }
`;

const push = keyframes`
	from { transform: translateY(-3.25rem); }
	to { transform: none; }
`;

const StyledCore = styled.section`
	.rows {
		margin: 0;
		padding: 0;
		list-style: none;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
	}

	/* 넓은 한 줄: 왼쪽 글, 오른쪽 장면. 줄 사이는 얇은 선 */
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: center;
		gap: 4rem;
		padding: 3.5rem 0;
		border-top: 1px solid ${({ theme }) => theme.color.border};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 1.75rem;
			padding: 2.5rem 0;
		}

		&:hover h3 {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.copy {
		word-break: keep-all;

		.no {
			display: block;
			margin-bottom: 0.75rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: 800;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};
		}

		h3 {
			margin: 0 0 1rem;
			font-size: clamp(2rem, 4.5vw, 3.25rem);
			font-weight: 800;
			line-height: 1.15;
			letter-spacing: -0.02em;
			color: ${({ theme }) => theme.color.text};
			transition: color 0.3s ease;
		}

		p {
			margin: 0;
			max-width: 26rem;
			line-height: 1.8;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.stage {
		display: grid;
		place-items: center;
		min-height: 15rem;
		padding: 2rem;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			min-height: 12rem;
			padding: 1.25rem;
		}
	}

	.demo {
		width: 100%;
		max-width: 22rem;
	}

	/* ---------- AI 큐레이션 ---------- */
	.curation {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};

		.chip {
			align-self: flex-start;
			padding: 0 0.5rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 10%, transparent);
		}

		.title {
			width: 75%;
			height: 0.75rem;
			border-radius: 0.25rem;
			background: ${({ theme }) => theme.color.text};
		}

		.part {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
		}

		.label {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
		}

		.text {
			position: relative;
			height: 0.4375rem;

			&.short {
				width: 60%;
			}
		}

		.ink {
			position: absolute;
			inset: 0;
			border-radius: 0.25rem;
			background: ${({ theme }) => theme.color.border};
			transform-origin: left;
		}

		/* 중요한 구절 형광펜 */
		.mark {
			position: absolute;
			left: 20%;
			top: -0.25rem;
			bottom: -0.25rem;
			width: 45%;
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 25%, transparent);
			transform-origin: left;
		}
	}

	.row[data-inview='true'] .curation {
		.ink {
			animation: ${write} 0.7s ease both;
			animation-delay: calc(0.2s + var(--i) * 0.35s);
		}

		.text.short .ink {
			animation-delay: calc(0.45s + var(--i) * 0.35s);
		}

		.mark {
			animation: ${write} 0.5s ease 1.4s both;
		}
	}

	/* ---------- 맞춤 구독 ---------- */
	.subscribe {
		/* 켜진 칩: 주 색 바탕에 바탕색 글자 (라이트·다크 모두 대비가 맞다) */
		--on-bg: ${({ theme }) => theme.color.primary};
		--on-fg: ${({ theme }) => theme.color.background};
		text-align: center;

		.chips {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.5rem;
		}

		.chip-toggle {
			padding: 0.375rem 1rem;
			border: 1px solid ${({ theme }) => theme.color.primary};
			border-radius: ${({ theme }) => theme.radius.chip};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.background};
		}

		.count {
			margin: 1.25rem 0 0;
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};

			strong {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.row[data-inview='true'] .subscribe {
		.chip-toggle.on {
			animation: ${turnOn} 0.3s ease both;
			animation-delay: calc(0.3s + var(--o) * 0.4s);
		}

		.count {
			animation: ${appear} 0.4s ease 1.5s both;
		}
	}

	/* ---------- 자동 발송 ---------- */
	.send {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};

		.mail {
			display: flex;
			align-items: center;
			gap: 0.625rem;
			height: 3.25rem;
			padding: 0 1rem;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};

			&:last-child {
				border-bottom: none;
			}
		}

		.new {
			font-size: ${({ theme }) => theme.fontSize.small};
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 6%, transparent);

			.dot {
				flex-shrink: 0;
				width: 0.5rem;
				height: 0.5rem;
				border-radius: 50%;
				background: ${({ theme }) => theme.color.primary};
			}

			.from {
				flex-shrink: 0;
				font-weight: 800;
				color: ${({ theme }) => theme.color.primary};
			}

			.subject {
				flex: 1;
				min-width: 0;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				color: ${({ theme }) => theme.color.text};
			}

			.at {
				flex-shrink: 0;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				font-variant-numeric: tabular-nums;
				color: ${({ theme }) => theme.color.subText};
			}
		}

		.old {
			.from-bar,
			.subject-bar {
				height: 0.4375rem;
				border-radius: 0.25rem;
				background: ${({ theme }) => theme.color.border};
			}

			.from-bar {
				flex: 0 0 3.5rem;
			}

			.subject-bar {
				flex: 1;
			}
		}
	}

	/* 새 메일이 위에서 들어오고, 아래 메일들은 한 칸 밀려난다 */
	.row[data-inview='true'] .send {
		.new {
			animation: ${arrive} 0.6s ease 0.6s both;
		}

		.old {
			animation: ${push} 0.6s ease 0.6s both;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row[data-inview='true'] .demo * {
			animation: none !important;
		}

		.subscribe .chip-toggle.on {
			color: ${({ theme }) => theme.color.background};
			background: ${({ theme }) => theme.color.primary};
		}
	}
`;
