'use client';

import { useRouter } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { LuArrowDown } from 'react-icons/lu';
import Button from '@/components/common/Button';
import { useOpenSubscribe } from '@/hooks/useOpenSubscribe';

const HEADLINE = ['쏟아지는 뉴스 속에서', '내 관심사만 골라', '매일 아침 한 통으로'];

/** 오른쪽 메일 미리보기에 보이는 소식 (모양만 보여 주는 장식) */
const PREVIEW = [
	{ category: 'IT', title: '오늘 가장 많이 다뤄진 소식', lines: 2 },
	{ category: '경제', title: '같은 사건은 하나로 묶어서', lines: 2 },
	{ category: '세계', title: '요약 · 시사점 · 문답까지', lines: 1 },
];

/**
 * 시작하기 첫 화면. 페이지를 열면 제목 줄이 아래에서 차례로 올라오고,
 * 오른쪽 메일 미리보기가 한 장씩 겹쳐 들어온다 (스크롤 없이 바로 보이는 곳이라 열릴 때 움직인다)
 */
export default function HeroSection() {
	const router = useRouter();
	const openSubscribe = useOpenSubscribe();

	const scrollNext = () => document.getElementById('about-numbers')?.scrollIntoView({ behavior: 'smooth' });

	return (
		<StyledHero>
			<div className="glow" aria-hidden />

			<div className="copy">
				<p className="eyebrow">AI 뉴스 큐레이션 · NEWPICK</p>
				<h1 className="headline">
					{HEADLINE.map((line, i) => (
						<span key={line} className="line" style={{ '--i': i } as React.CSSProperties}>
							<span className={i === 1 ? 'mark' : undefined}>{line}</span>
						</span>
					))}
				</h1>
				<p className="lead">
					NEWPICK은 AI가 그날의 기사를 읽고 중요한 소식만 골라 요약합니다.
					<br className="desktop-only" /> 고른 분야를 엮은 메일 한 통을 매일 아침 받아 보세요.
				</p>
				<div className="actions">
					<Button scheme="primary" size="large" onClick={() => openSubscribe()}>
						무료로 구독하기
					</Button>
					<Button scheme="outline" size="large" onClick={() => router.push('/articles')}>
						뉴스레터 둘러보기
					</Button>
				</div>
			</div>

			<div className="visual" aria-hidden>
				<div className="mail">
					<div className="mail-head">
						<span className="logo">NEWPICK</span>
						<span className="time">오늘 08:40</span>
					</div>
					<p className="mail-title">오늘의 뉴픽 · IT · 경제 · 세계</p>
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

			<button type="button" className="cue" onClick={scrollNext} aria-label="아래로 이동">
				<LuArrowDown />
			</button>
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
	from { background-size: 0% 40%; }
	to { background-size: 100% 40%; }
`;

const float = keyframes`
	0%, 100% { transform: translateY(0) rotate(-2deg); }
	50% { transform: translateY(-0.75rem) rotate(-2deg); }
`;

const drift = keyframes`
	0%, 100% { transform: translate(0, 0) scale(1); }
	50% { transform: translate(-4%, 6%) scale(1.08); }
`;

const bounce = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(0.375rem); }
`;

const StyledHero = styled.section`
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
	align-items: center;
	gap: 3rem;
	min-height: calc(100svh - 10rem);
	padding: 2rem 0 5rem;
	overflow: clip;

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		grid-template-columns: 1fr;
		min-height: auto;
		gap: 2.5rem;
		padding: 0 0 4rem;
	}

	/* 뒤에서 천천히 움직이는 빛 */
	.glow {
		position: absolute;
		inset: 10% -10% auto auto;
		width: 60%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			color-mix(in srgb, ${({ theme }) => theme.color.primary} 22%, transparent),
			transparent 65%
		);
		filter: blur(1rem);
		z-index: -1;
		animation: ${drift} 14s ease-in-out infinite;
	}

	.eyebrow {
		margin: 0 0 1.25rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		letter-spacing: 0.08em;
		color: ${({ theme }) => theme.color.primary};
		animation: ${fadeUp} 0.6s ease both;
	}

	.headline {
		margin: 0 0 1.5rem;
		font-size: clamp(2.25rem, 5.5vw, 4rem);
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: -0.02em;
		word-break: keep-all;
		color: ${({ theme }) => theme.color.text};

		/* 줄마다 가림막 안에서 아래 → 위로 */
		.line {
			display: block;
			overflow: hidden;
			padding-bottom: 0.08em;

			& > span {
				display: inline-block;
				animation: ${rise} 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
				animation-delay: calc(0.15s + var(--i) * 0.12s);
			}
		}

		/* '내 관심사만 골라'에 형광펜이 그어진다 */
		.line > .mark {
			background: linear-gradient(
					color-mix(in srgb, ${({ theme }) => theme.color.primary} 28%, transparent),
					color-mix(in srgb, ${({ theme }) => theme.color.primary} 28%, transparent)
				)
				no-repeat left 88% / 100% 40%;
			animation:
				${rise} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.27s both,
				${sweep} 0.7s ease 1s both;
		}
	}

	.lead {
		margin: 0 0 2.25rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
		line-height: 1.8;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
		animation: ${fadeUp} 0.7s ease 0.6s both;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			.desktop-only {
				display: none;
			}
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		animation: ${fadeUp} 0.7s ease 0.75s both;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			button {
				flex: 1 1 100%;
			}
		}
	}

	/* 메일 미리보기: 카드가 기울어진 채 떠 있고, 소식이 한 줄씩 들어온다 */
	.visual {
		display: flex;
		justify-content: center;
		animation: ${fadeUp} 0.9s ease 0.4s both;
	}

	.mail {
		width: min(100%, 24rem);
		padding: 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: 1.25rem;
		background: ${({ theme }) => theme.color.background};
		box-shadow: 0 1.5rem 3rem color-mix(in srgb, ${({ theme }) => theme.color.primary} 14%, transparent);
		animation: ${float} 6s ease-in-out 1.4s infinite;
		transform: rotate(-2deg);
	}

	.mail-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		.logo {
			font-weight: 800;
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.mail-title {
		margin: 0 0 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
	}

	.story {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem 0;
		animation: ${fadeUp} 0.6s ease both;
		animation-delay: calc(0.9s + var(--i) * 0.18s);

		& + .story {
			border-top: 1px dashed ${({ theme }) => theme.color.border};
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
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.text};
		}

		.bar {
			height: 0.5rem;
			border-radius: 0.25rem;
			background: ${({ theme }) => theme.color.surface};

			&:last-child {
				width: 70%;
			}
		}
	}

	.cue {
		position: absolute;
		left: 50%;
		bottom: 0.5rem;
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		margin-left: -1.25rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: 50%;
		color: ${({ theme }) => theme.color.subText};
		background: ${({ theme }) => theme.color.background};
		cursor: pointer;
		animation: ${bounce} 1.8s ease-in-out 1.6s infinite;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		*,
		.glow,
		.mail,
		.cue,
		.headline .line > span {
			animation: none !important;
		}
	}
`;
