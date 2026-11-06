'use client';

import styled from 'styled-components';
import Img from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

interface Step {
	title: string;
	text: string;
	/** 없으면 화면 모양을 그린 LoginMock을 보여 준다 */
	image?: string;
	alt?: string;
	/** 원본 크기: 그림이 늦게 로드돼도 자리를 미리 잡아 줄이 밀리지 않게 (스크롤 진행도가 어긋나지 않는다) */
	size?: [number, number];
}

const STEPS: Step[] = [
	{
		title: '구글로 로그인',
		text: '구글 계정으로 바로 시작해요. 따로 가입 양식을 채울 필요가 없어요.',
	},
	{
		title: '관심사 고르기',
		text: 'IT · 정치 · 경제 · 사회 · 생활 · 세계 다양한 분야의 뉴스를 정리해 중요한 것만 보내드려요. 놓치고 싶지 않은 소식을 매일 아침, 한 통으로 압축해 받아보세요.',
		image: '/img/about_categories.jpg',
		size: [1390, 334],
		alt: '관심사를 고르는 화면',
	},
	{
		title: '구독 완료',
		text: '다음 날 아침부터 뉴스레터가 도착해요. 관심사는 마이페이지에서 언제든 바꿀 수 있어요.',
		image: '/img/about_sns-login.jpg',
		size: [1534, 756],
		alt: '구독 설정이 완료되었다는 안내',
	},
	{
		title: '뉴스레터 받기',
		text: '매일 아침 8시 40분, 출근 길에 메일함을 열면 오늘 꼭 알아야 할 소식이 메일 한 통으로 정리돼 있어요. 지나간 소식은 마이페이지에서 언제든 다시 확인할 수 있어요.',
		image: '/img/about_mail-user.jpg',
		size: [1200, 1700],
		alt: '메일로 받은 뉴스레터',
	},
	{
		title: '후속 지켜보기',
		text: "각 소식의 관전 포인트에서 '후속 지켜보기'를 활성화하면, 이어지는 새 소식이 나왔을 때 메일 상단에 알려드려요. 마이페이지에서 같은 내용을 확인하고 관리할 수 있어요.",
		image: '/img/about_follow.jpg',
		size: [2144, 354],
		alt: "소식 끝의 관전 포인트와 '후속 지켜보기' 단추",
	},
	{
		title: '스크랩 · 메모',
		text: '읽다가 중요한 문장을 드래그해 스크랩하거나 메모를 남겨요. 스크랩은 마이페이지에 모이고, 폴더로 정리할 수 있어요.',
		image: '/img/about_scrap-card.jpg',
		size: [2048, 600],
		alt: '마이페이지에 모인 스크랩한 문장',
	},
	{
		title: '태그 팔로우 · 지켜보기',
		text: "관심 있는 태그를 팔로우하면 메일로 그 태그의 새 소식을 따로 모아 보내드려요. 지켜보는 소식에 이어진 새 소식이 발견되면 메일로 알려드려요. 이 모든 소식들은 마이페이지 '지켜보기'에서 시간순으로 쌓여요.",
		image: '/img/about_follows-tab.jpg',
		size: [2048, 952],
		alt: '마이페이지의 팔로우한 태그와 지켜보는 소식',
	},
];

/** 앞 네 단계(시작)와 뒤 세 단계(읽은 뒤의 흐름) 사이에 두 번째 제목을 둔다 */
const FIRST_PART = 4;

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

/** 한 단계: 그림은 화면 끝까지 닿고, 스크롤하면 자기 쪽 끝에서 밀려 들어온다 (--progress 0 → 1). 줄 높이가 달라도 가운데에 왔을 때 끝나게 center */
function StepRow({ step, index }: { step: Step; index: number }) {
	const ref = useScrollProgress<HTMLLIElement>('center');

	return (
		<li ref={ref} className={index % 2 === 0 ? 'row' : 'row reverse'}>
			<div className="copy">
				<span className="no">{String(index + 1).padStart(2, '0')}</span>
				<h3>{step.title}</h3>
				<p>{step.text}</p>
			</div>
			<div className="shot">
				{step.image ? (
					<Img
						src={step.image}
						alt={step.alt ?? ''}
						width={step.size?.[0] ?? 0}
						height={step.size?.[1] ?? 0}
						sizes="(max-width: 768px) 100vw, 60vw"
					/>
				) : (
					<LoginMock />
				)}
			</div>
		</li>
	);
}

/**
 * HOW TO USE: 화면 폭을 꽉 채우는 지그재그. 단계마다 그림이 왼쪽 끝 → 오른쪽 끝을 번갈아 차지한다.
 * 줄을 화면 폭(100vw)으로 넓히고, 스크롤바 폭만큼 넘치는 부분은 시작하기 페이지의 body overflow-x: clip이 자른다
 * (예전에는 그림을 페이지 밖까지 밀어 두어 가로 스크롤이 생겼다)
 */
export default function HowToUseSection() {
	return (
		<StyledHowToUse data-track-section="about-how-to-use">
			<SectionHeading
				label="HOW TO USE"
				title="세 번의 클릭으로, 간단하게 시작."
				sub="간편하게 로그인하고 원하는 분야를 자유롭게 선택하세요. 매일 아침 출근 전, 간밤에 놓친 중요한 소식들과 아침 속보까지 한 통으로 받아볼 수 있어요."
			/>
			<ol className="rows">
				{STEPS.slice(0, FIRST_PART).map((step, i) => (
					<StepRow key={step.title} step={step} index={i} />
				))}
			</ol>
			{/* 받은 뒤의 흐름: 뒤 세 단계 앞에 두 번째 제목 */}
			<div className="mid">
				<h3 className="mid-title">유기적으로 이어지는 흐름.</h3>
				<p className="mid-sub">
					한 번 읽고 끝내지 마세요. 북마크와 스크랩으로 중요한 내용을 저장하고, 후속 뉴스 지켜보기, 태그 팔로우로 맞춤형
					뉴스레터를 받아보세요.
				</p>
			</div>
			<ol className="rows">
				{STEPS.slice(FIRST_PART).map((step, i) => (
					<StepRow key={step.title} step={step} index={FIRST_PART + i} />
				))}
			</ol>
		</StyledHowToUse>
	);
}

const StyledHowToUse = styled.section`
	/* 두 번째 제목: 섹션 제목과 같은 꼴을 한 단계 작게, 위아래로 단계 사이 간격만큼 */
	.mid {
		margin: 8rem 0 3.5rem;
		word-break: keep-all;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			margin: 5rem 0 2.5rem;
		}
	}

	.mid-title {
		margin: 0;
		font-size: clamp(1.75rem, 4vw, 2.75rem);
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: -0.02em;
		color: ${({ theme }) => theme.color.text};
	}

	.mid-sub {
		max-width: 40rem;
		margin: 1rem 0 0;
		font-size: ${({ theme }) => theme.fontSize.medium};
		line-height: 1.7;
		color: ${({ theme }) => theme.color.subText};
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: 6rem;
		margin: 0;
		padding: 0;
		list-style: none;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			gap: 4rem;
		}
	}

	/* 화면 끝까지 넓힌 줄: 그림 60%는 화면 끝에 붙고, 글 40%는 다른 섹션과 같은 본문 폭 안쪽에 맞춘다.
	   짝수 줄은 그림 왼쪽 · 글 오른쪽, 홀수 줄(reverse)은 반대 */
	.row {
		--progress: 0;
		--from: -1;
		/* 본문(1024px) 바깥 여백. 글을 이만큼 안쪽에 두어 다른 섹션의 왼쪽·오른쪽 끝과 맞춘다 */
		--gutter: max(1rem, calc((100vw - ${({ theme }) => theme.layout.width.large}) / 2));
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		align-items: center;
		gap: 4rem;
		width: 100vw;
		margin-left: calc(50% - 50vw);

		.shot {
			order: -1;
		}

		.copy {
			padding-right: var(--gutter);
		}

		&.reverse {
			--from: 1;
			grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);

			.shot {
				order: 0;
				border-right: none;
				border-left: 1px solid ${({ theme }) => theme.color.border};
				border-radius: ${({ theme }) => theme.radius.surface} 0 0 ${({ theme }) => theme.radius.surface};
			}

			.copy {
				padding-right: 0;
				padding-left: var(--gutter);
			}
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 1.5rem;
			width: auto;
			margin-left: 0;

			.shot {
				order: 0;
			}

			.copy {
				padding: 0;
			}

			&.reverse {
				grid-template-columns: 1fr;

				.copy {
					padding: 0;
				}

				.shot {
					border: 1px solid ${({ theme }) => theme.color.border};
					border-radius: ${({ theme }) => theme.radius.surface};
				}
			}
		}
	}

	.copy {
		word-break: keep-all;

		.no {
			display: block;
			margin-bottom: 0.5rem;
			font-size: 2.5rem;
			font-weight: 800;
			line-height: 1;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};
		}

		h3 {
			margin: 0 0 0.75rem;
			font-size: clamp(1.375rem, 2.4vw, 1.75rem);
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}

		p {
			margin: 0;
			line-height: 1.8;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 그림: 화면 끝 쪽은 테두리·모서리 없이 붙이고, 스크롤하면 그쪽에서 6rem 밀려 들어온다 */
	.shot {
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-left: none;
		border-radius: 0 ${({ theme }) => theme.radius.surface} ${({ theme }) => theme.radius.surface} 0;
		background: ${({ theme }) => theme.color.surface};
		opacity: calc(0.2 + var(--progress) * 0.8);
		transform: translateX(calc((1 - var(--progress)) * var(--from) * 6rem));

		img {
			display: block;
			width: 100%;
			height: auto;
			max-height: 32rem;
			object-fit: cover;
			object-position: top;
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.surface};
			opacity: 1;
			transform: none;
		}
	}

	.login-mock {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.875rem;
		padding: 4rem 1.5rem;
		text-align: center;
		color: ${({ theme }) => theme.color.text};

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
			background: ${({ theme }) => theme.color.background};
		}

		.mock-terms {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shot {
			opacity: 1;
			transform: none;
		}
	}
`;
