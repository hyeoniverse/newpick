'use client';

import styled from 'styled-components';
import Img from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import BorderTitle from '@/components/common/BorderTitle';
import { useScrollSequence } from '@/hooks/useScrollSequence';

interface Step {
	title: string;
	text: string;
	/** 없으면 화면 모양을 그린 LoginMock을 보여 준다 */
	image?: string;
	alt?: string;
}

const STEPS: Step[] = [
	{
		title: '구글로 로그인',
		text: '구글 계정으로 바로 시작합니다. 따로 가입 양식을 채울 필요가 없습니다.',
	},
	{
		title: '관심사 고르기',
		text: '받고 싶은 관심사만 고릅니다. 여러 개를 골라도 메일은 한 통으로 옵니다.',
		image: '/img/about_categories.jpg',
		alt: '관심사를 고르는 화면',
	},
	{
		title: '구독 완료',
		text: '고른 관심사로 구독이 시작됩니다. 관심사는 마이페이지에서 언제든 바꿀 수 있습니다.',
		image: '/img/about_sns-login.jpg',
		alt: '구독 설정이 완료되었다는 안내',
	},
	{
		title: '뉴스레터 받기',
		text: '매일 아침 메일함에서 읽고, 지난 뉴스레터는 사이트에서 다시 봅니다.',
		image: '/img/about_newsletter-mail.jpg',
		alt: '메일로 받은 뉴스레터',
	},
];

/** 로그인 단계는 캡처가 없어 로그인 창 모양을 그린다 (장식) */
function LoginMock() {
	return (
		<div className="login-mock">
			<span className="mock-logo">NP</span>
			<p className="mock-title">로그인하고 내 관심사 뉴스를 받아 보세요</p>
			<span className="mock-google">
				<FcGoogle /> Google로 계속하기
			</span>
			<p className="mock-terms">이용약관 · 개인정보 처리방침</p>
		</div>
	);
}

/**
 * 스크롤 시퀀스: 왼쪽 단계를 내려가는 동안 오른쪽 화면이 붙어 있고, 단계가 바뀌면 그림이 바뀐다.
 * 좁은 화면은 붙는 화면 없이 단계마다 그림을 바로 아래에 둔다
 * (예전에는 그림을 화면 폭 기준으로 밀어 두어 페이지가 가로로 스크롤됐다)
 */
export default function HowToUseSection() {
	const { containerRef, stepRef, active } = useScrollSequence<HTMLOListElement, HTMLLIElement>(STEPS.length);

	return (
		<StyledHowToUse>
			<BorderTitle text="HOW TO USE" />
			<p className="sub-text">로그인하고 관심사만 고르면, 매일 아침 뉴스레터가 옵니다.</p>

			<div className="layout">
				<ol ref={containerRef} className="steps">
					{STEPS.map((step, i) => (
						<li key={step.title} ref={stepRef(i)} className="step" data-active={i === active}>
							<span className="no">{String(i + 1).padStart(2, '0')}</span>
							<h3 className="step-title">{step.title}</h3>
							<p className="step-text">{step.text}</p>
							<div className="inline-shot">
								{step.image ? (
									<Img src={step.image} alt={step.alt ?? ''} width={0} height={0} sizes="100vw" />
								) : (
									<LoginMock />
								)}
							</div>
						</li>
					))}
				</ol>

				<div className="stage" aria-hidden>
					<div className="frame">
						<div className="frame-bar">
							<span />
							<span />
							<span />
						</div>
						<div className="shots">
							{STEPS.map((step, i) =>
								step.image ? (
									<Img
										key={step.title}
										src={step.image}
										alt=""
										fill
										sizes="(max-width: 768px) 0px, 50vw"
										className={i === active ? 'shot on' : 'shot'}
									/>
								) : (
									<div key={step.title} className={i === active ? 'shot mock on' : 'shot mock'}>
										<LoginMock />
									</div>
								),
							)}
						</div>
					</div>
					<div className="progress">
						{STEPS.map((step, i) => (
							<span key={step.title} className={i === active ? 'on' : undefined}>
								{step.title}
							</span>
						))}
					</div>
				</div>
			</div>
		</StyledHowToUse>
	);
}

const StyledHowToUse = styled.section`
	.sub-text {
		margin: -1.5rem 0 3rem;
		line-height: 1.8;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
		gap: 4rem;
		align-items: start;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
		}
	}

	.steps {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.step {
		min-height: 55vh;
		padding-top: 10vh;
		opacity: 0.35;
		transition: opacity 0.35s ease;

		&:first-child {
			padding-top: 0;
		}

		&[data-active='true'] {
			opacity: 1;

			.no {
				color: ${({ theme }) => theme.color.primary};
			}
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			min-height: auto;
			padding: 0 0 3rem;
			opacity: 1;

			.no {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.no {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 2.5rem;
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.neutral};
		transition: color 0.35s ease;
	}

	.step-title {
		margin: 0 0 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.large};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
	}

	.step-text {
		margin: 0;
		line-height: 1.8;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	/* 좁은 화면: 단계마다 그림을 바로 아래에 */
	.inline-shot {
		display: none;
		margin-top: 1.25rem;
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		img {
			display: block;
			width: 100%;
			height: auto;
		}

		.login-mock {
			padding: 2rem 1rem;
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			display: block;
		}
	}

	.shot.mock {
		display: grid;
		place-items: center;
	}

	.login-mock {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.875rem;
		text-align: center;
		color: ${({ theme }) => theme.color.text};
		background: ${({ theme }) => theme.color.background};

		.mock-logo {
			display: grid;
			place-items: center;
			width: 3rem;
			height: 3rem;
			border-radius: ${({ theme }) => theme.radius.surface};
			font-weight: 800;
			color: #ffffff;
			background: ${({ theme }) => theme.color.primary};
		}

		.mock-title {
			margin: 0;
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			word-break: keep-all;
		}

		.mock-google {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}

		.mock-terms {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.shot.mock .login-mock {
		width: 70%;
		padding: 2.5rem 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.floating};
	}

	/* 넓은 화면: 스크롤하는 동안 붙어 있는 브라우저 모양 틀 */
	.stage {
		position: sticky;
		top: 7rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			display: none;
		}
	}

	.frame {
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};
	}

	.frame-bar {
		display: flex;
		gap: 0.375rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.background};

		span {
			width: 0.625rem;
			height: 0.625rem;
			border-radius: 50%;
			background: ${({ theme }) => theme.color.border};
		}
	}

	.shots {
		position: relative;
		aspect-ratio: 4 / 3;

		.shot {
			position: absolute;
			inset: 0;
			object-fit: contain;
			padding: 1.5rem;
			opacity: 0;
			transform: scale(0.97);
			transition:
				opacity 0.5s ease,
				transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

			&.on {
				opacity: 1;
				transform: none;
			}
		}
	}

	.progress {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};

		span {
			position: relative;
			padding-top: 0.625rem;
			transition: color 0.3s ease;

			&::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 2px;
				background: ${({ theme }) => theme.color.border};
			}

			&.on {
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				color: ${({ theme }) => theme.color.text};

				&::before {
					background: ${({ theme }) => theme.color.primary};
				}
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.step,
		.no,
		.shots .shot,
		.progress span {
			transition: none;
		}
	}
`;
