'use client';

import { useRouter } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { LuChevronRight } from 'react-icons/lu';
import Button from '@/components/common/Button';
import { useOpenSubscribe } from '@/hooks/useOpenSubscribe';
import { useScrollProgress } from '@/hooks/useScrollProgress';

const HEADLINE = ['내 관심사만 골라,', '매일 아침 한 통으로.'];

/** 메일 미리보기에 보이는 소식 (모양만 보여 주는 장식) */
const PREVIEW = [
	{ category: 'IT', title: '오늘 가장 많이 다뤄진 소식', lines: 3 },
	{ category: '경제', title: '같은 사건은 하나로 묶어서', lines: 3 },
	{ category: '세계', title: '요약 · 시사점 · 문답까지', lines: 2 },
];

/**
 * 시작하기 첫 화면. 열리면 제목 줄이 아래에서 차례로 올라오고,
 * 아래 메일 미리보기는 스크롤할수록 커지며 제자리로 올라온다 (--progress: 0 → 1)
 */
export default function HeroSection() {
	const router = useRouter();
	const openSubscribe = useOpenSubscribe();
	const stageRef = useScrollProgress<HTMLDivElement>('enter');

	return (
		<StyledHero data-track-section="about-hero">
			<p className="eyebrow">AI 뉴스 큐레이션 · NEWPICK</p>
			<h1 className="headline">
				{HEADLINE.map((line, i) => (
					<span key={line} className="line" style={{ '--i': i } as React.CSSProperties}>
						<span className={i === 0 ? 'mark' : undefined}>{line}</span>
					</span>
				))}
			</h1>
			<p className="lead">
				AI가 그날의 기사를 읽고 중요한 소식만 골라 요약합니다.
				<br className="desktop-only" /> 고른 관심사를 엮은 메일 한 통을 매일 아침 받아 보세요.
			</p>
			<div className="actions">
				<Button scheme="primary" size="large" onClick={() => openSubscribe()}>
					무료로 구독하기
				</Button>
				<button type="button" className="text-link" onClick={() => router.push('/articles')}>
					뉴스레터 둘러보기 <LuChevronRight aria-hidden />
				</button>
			</div>

			<div ref={stageRef} className="stage" aria-hidden>
				<div className="mail">
					<div className="mail-bar">
						<span className="logo">NEWPICK</span>
						<span className="meta">오늘 08:40 · 관심사 3개</span>
					</div>
					<p className="mail-title">오늘의 뉴픽</p>
					<div className="stories">
						{PREVIEW.map((item, i) => (
							<div key={item.title} className="story" style={{ '--i': i } as React.CSSProperties}>
								<span className="chip">{item.category}</span>
								<p className="story-title">{item.title}</p>
								{Array.from({ length: item.lines }, (_, l) => (
									<span key={l} className="bar" />
								))}
							</div>
						))}
					</div>
				</div>
			</div>
		</StyledHero>
	);
}

const rise = keyframes`
	from { transform: translateY(105%); }
	to { transform: none; }
`;

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(1rem); }
	to { opacity: 1; transform: none; }
`;

const sweep = keyframes`
	from { background-size: 0% 35%; }
	to { background-size: 100% 35%; }
`;

const StyledHero = styled.section`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: clamp(3rem, 10vh, 7rem);
	text-align: center;
	word-break: keep-all;

	.eyebrow {
		margin: 0 0 1.5rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		letter-spacing: 0.08em;
		color: ${({ theme }) => theme.color.primary};
		animation: ${fadeUp} 0.6s ease both;
	}

	.headline {
		margin: 0 0 1.75rem;
		font-size: clamp(2.5rem, 7.5vw, 5.5rem);
		font-weight: 800;
		line-height: 1.12;
		letter-spacing: -0.03em;
		color: ${({ theme }) => theme.color.text};

		/* 줄마다 가림막 안에서 아래 → 위로 */
		.line {
			display: block;
			overflow: hidden;
			padding-bottom: 0.06em;

			& > span {
				display: inline-block;
				animation: ${rise} 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
				animation-delay: calc(0.15s + var(--i) * 0.14s);
			}

			/* '내 관심사만 골라,'에 형광펜 */
			& > .mark {
				background: linear-gradient(
						color-mix(in srgb, ${({ theme }) => theme.color.primary} 26%, transparent),
						color-mix(in srgb, ${({ theme }) => theme.color.primary} 26%, transparent)
					)
					no-repeat left 90% / 100% 35%;
				animation:
					${rise} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both,
					${sweep} 0.8s ease 1s both;
			}
		}
	}

	.lead {
		margin: 0 0 2.5rem;
		font-size: clamp(1rem, 1.6vw, 1.25rem);
		line-height: 1.7;
		color: ${({ theme }) => theme.color.subText};
		animation: ${fadeUp} 0.7s ease 0.55s both;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			.desktop-only {
				display: none;
			}
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 1rem 2rem;
		animation: ${fadeUp} 0.7s ease 0.7s both;
	}

	.text-link {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};

		svg {
			transition: transform 0.2s ease;
		}

		&:hover {
			text-decoration: underline;

			svg {
				transform: translateX(0.2rem);
			}
		}
	}

	/* 메일 미리보기: 스크롤할수록 88% → 100%로 커지고 3rem 아래에서 제자리로 */
	.stage {
		--progress: 0;
		width: 100%;
		margin-top: clamp(3.5rem, 9vh, 6rem);
		animation: ${fadeUp} 0.9s ease 0.85s both;
	}

	.mail {
		width: 100%;
		max-width: 60rem;
		margin: 0 auto;
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		text-align: left;
		transform: translateY(calc((1 - var(--progress)) * 3rem)) scale(calc(0.88 + var(--progress) * 0.12));
		transform-origin: center top;
	}

	.mail-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.875rem 1.5rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.surface};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		.logo {
			font-weight: 800;
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.mail-title {
		margin: 0;
		padding: 1.75rem 1.5rem 0;
		font-size: ${({ theme }) => theme.fontSize.large};
		font-weight: 800;
		color: ${({ theme }) => theme.color.text};
	}

	.stories {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem;
		padding: 1.25rem 1.5rem 2rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}

	.story {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		animation: ${fadeUp} 0.6s ease both;
		animation-delay: calc(1.1s + var(--i) * 0.15s);

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			&:nth-child(n + 3) {
				display: none;
			}
		}

		.chip {
			align-self: flex-start;
			padding: 0.0625rem 0.5rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 10%, transparent);
		}

		.story-title {
			margin: 0 0 0.25rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
		}

		.bar {
			height: 0.5rem;
			border-radius: 0.25rem;
			background: ${({ theme }) => theme.color.surface};

			&:last-child {
				width: 65%;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		*,
		.headline .line > span,
		.headline .line > .mark {
			animation: none !important;
		}

		.mail {
			transform: none;
		}
	}
`;
