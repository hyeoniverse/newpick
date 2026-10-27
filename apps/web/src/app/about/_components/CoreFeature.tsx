'use client';

import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

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
				<span className="subject">오늘의 뉴픽</span>
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
		name: 'AI 큐레이션',
		headline: '필요한 것만 남기고,\n핵심만 정리.',
		text: '방대한 기사 중 중요한 소식만 고르고, 요약 · 시사점 · 문답으로 정리합니다.',
		Demo: CurationDemo,
	},
	{
		name: '맞춤 구독',
		headline: '내 관심사만.\n메일은 한 통.',
		text: '원하는 관심사만 고르면, 여러 개를 골라도 한 통으로 엮어 보냅니다.',
		Demo: SubscribeDemo,
	},
	{
		name: '자동 발송',
		headline: '찾아보지 않아도,\n아침 8시 40분.',
		text: '매일 아침 정해진 시간에 메일함으로 도착합니다.',
		Demo: SendDemo,
	},
];

/**
 * 기능 하나: 가운데 정렬로 작은 기능 이름 → 아주 큰 한 문장 → 설명 → 큰 장면.
 * 장면은 스크롤할수록 커지며 올라오고(--progress), 화면에 들어오면 안의 움직임이 시작된다
 */
function FeatureBlock({ name, headline, text, Demo }: (typeof FEATURES)[number]) {
	const stageRef = useScrollProgress<HTMLDivElement>('enter');
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
			{ rootMargin: '0px 0px -30% 0px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<li ref={ref} className="feature" data-inview={inView}>
			<p className="name">{name}</p>
			<h3 className="headline">
				{headline.split('\n').map((line) => (
					<span key={line}>{line}</span>
				))}
			</h3>
			<p className="desc">{text}</p>
			<div ref={stageRef} className="stage" aria-hidden>
				<Demo />
			</div>
		</li>
	);
}

/** 핵심 기능: 기능마다 애플 제품 페이지처럼 큰 제목 + 큰 장면을 세로로 */
export default function CoreFeature() {
	return (
		<StyledCore>
			<SectionHeading label="CORE FEATURE" />
			<ol className="features">
				{FEATURES.map((feature) => (
					<FeatureBlock key={feature.name} {...feature} />
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
	/* 처음 디자인처럼 화면 폭 전체에 회색 띠. 안쪽 내용은 본문 폭 그대로
	   (100vw가 스크롤바만큼 넘치는 부분은 시작하기 페이지의 body overflow-x: clip이 자른다) */
	width: 100vw;
	margin-left: calc(50% - 50vw);
	padding: 8rem max(1rem, calc((100vw - ${({ theme }) => theme.layout.width.large}) / 2));
	background: ${({ theme }) => theme.color.surface};

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		padding-top: 5rem;
		padding-bottom: 5rem;
	}

	.features {
		display: flex;
		flex-direction: column;
		gap: 9rem;
		margin: 0;
		padding: 0;
		list-style: none;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			gap: 5rem;
		}
	}

	/* 가운데 정렬: 작은 기능 이름 → 큰 한 문장 → 설명 → 큰 장면 */
	.feature {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		word-break: keep-all;
	}

	.name {
		margin: 0 0 1rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: 800;
		color: ${({ theme }) => theme.color.primary};
	}

	.headline {
		display: flex;
		flex-direction: column;
		margin: 0 0 1.25rem;
		font-size: clamp(2.25rem, 6vw, 4.5rem);
		font-weight: 800;
		line-height: 1.12;
		letter-spacing: -0.03em;
		color: ${({ theme }) => theme.color.text};
	}

	.desc {
		max-width: 32rem;
		margin: 0 0 3.5rem;
		font-size: clamp(1rem, 1.6vw, 1.25rem);
		line-height: 1.7;
		color: ${({ theme }) => theme.color.subText};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			margin-bottom: 2rem;
		}
	}

	/* 큰 장면: 스크롤할수록 92% → 100%로 커지며 2rem 아래에서 올라온다 */
	.stage {
		--progress: 0;
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 26rem;
		padding: 3rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		/* 회색 띠 위라 장면 판은 바탕색 */
		background: ${({ theme }) => theme.color.background};
		transform: translateY(calc((1 - var(--progress)) * 2rem)) scale(calc(0.92 + var(--progress) * 0.08));

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			min-height: 16rem;
			padding: 1.5rem;
		}
	}

	.demo {
		width: 100%;
		max-width: 30rem;
		text-align: left;
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

	.feature[data-inview='true'] .curation {
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
			padding: 0.5rem 1.25rem;
			font-size: ${({ theme }) => theme.fontSize.medium};
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

	.feature[data-inview='true'] .subscribe {
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
	.feature[data-inview='true'] .send {
		.new {
			animation: ${arrive} 0.6s ease 0.6s both;
		}

		.old {
			animation: ${push} 0.6s ease 0.6s both;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stage {
			transform: none;
		}

		.feature[data-inview='true'] .demo * {
			animation: none !important;
		}

		.subscribe .chip-toggle.on {
			color: ${({ theme }) => theme.color.background};
			background: ${({ theme }) => theme.color.primary};
		}
	}
`;
