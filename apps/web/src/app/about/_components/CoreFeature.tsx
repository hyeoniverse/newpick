'use client';

import styled from 'styled-components';
import Img from 'next/image';
import { TbMailAi, TbMailCheck, TbMailShare } from 'react-icons/tb';
import SectionHeading from '@/app/about/_components/SectionHeading';

const FEATURES = [
	{
		icon: TbMailAi,
		title: 'AI 큐레이션',
		text: '방대한 기사 중 필요한 정보만 추출하고 요약합니다.',
		image: '/img/about_curation.jpg',
		alt: 'AI가 요약한 뉴스레터',
	},
	{
		icon: TbMailCheck,
		title: '맞춤 구독',
		text: '원하는 관심사만 골라 구독합니다.',
		image: '/img/about_subscribe.jpg',
		alt: '관심사를 골라 구독하는 화면',
	},
	{
		icon: TbMailShare,
		title: '자동 발송',
		text: '매일 아침 정해진 시간에 메일로 전달합니다.',
		image: '/img/about_send.jpg',
		alt: '메일로 받은 뉴스레터 목록',
	},
];

/** 핵심 기능: 큰 제목 아래 타일 세 장. 첫 타일은 넓게, 나머지 둘은 나란히 */
export default function CoreFeature() {
	return (
		<StyledCore>
			<SectionHeading label="CORE FEATURE" title="읽을 것만, 읽기 좋게." />
			<ul className="tiles">
				{FEATURES.map(({ icon: Icon, title, text, image, alt }) => (
					<li key={title} className="tile">
						<div className="copy">
							<Icon className="icon" aria-hidden />
							<h3>{title}</h3>
							<p>{text}</p>
						</div>
						<div className="shot">
							<Img src={image} alt={alt} width={0} height={0} sizes="(max-width: 768px) 100vw, 60vw" />
						</div>
					</li>
				))}
			</ul>
		</StyledCore>
	);
}

const StyledCore = styled.section`
	.tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
		}
	}

	.tile {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 2.5rem 2.5rem 0;
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			padding: 1.75rem 1.5rem 0;
		}

		/* 첫 타일은 두 칸을 차지하고 글·그림을 나란히 */
		&:first-child {
			grid-column: 1 / -1;
			flex-direction: row;
			align-items: center;
			padding-bottom: 2.5rem;

			.copy {
				flex: 0 0 18rem;
			}

			/* 긴 캡처는 윗부분만 보이게 자른다 */
			.shot {
				flex: 1;
				max-height: 26rem;
				border-bottom: 1px solid ${({ theme }) => theme.color.border};
				border-radius: ${({ theme }) => theme.radius.surface};
			}

			@media ${({ theme }) => theme.mediaQuery.tablet} {
				flex-direction: column;
				align-items: stretch;
				padding-bottom: 0;

				.copy {
					flex-basis: auto;
				}

				.shot {
					max-height: 18rem;
					border-bottom: none;
					border-radius: ${({ theme }) => theme.radius.surface} ${({ theme }) => theme.radius.surface} 0 0;
				}
			}
		}
	}

	.copy {
		word-break: keep-all;

		.icon {
			width: 2.25rem;
			height: 2.25rem;
			margin-bottom: 1rem;
			color: ${({ theme }) => theme.color.primary};
		}

		h3 {
			margin: 0 0 0.5rem;
			font-size: clamp(1.375rem, 2.4vw, 1.75rem);
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}

		p {
			margin: 0;
			line-height: 1.7;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.shot {
		margin-top: auto;
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-bottom: none;
		border-radius: ${({ theme }) => theme.radius.surface} ${({ theme }) => theme.radius.surface} 0 0;
		background: ${({ theme }) => theme.color.background};

		img {
			display: block;
			width: 100%;
			height: auto;
		}
	}
`;
