'use client';

import styled, { keyframes } from 'styled-components';
import { LuPlus } from 'react-icons/lu';
import BorderTitle from '@/components/common/BorderTitle';

/** 답은 실제 동작 기준 (이용약관 요약·발송 예약·탈퇴 처리와 같은 내용) */
const FAQ = [
	{
		q: '정말 무료인가요?',
		a: '네. 뉴스레터 열람 · 구독 · 북마크 모두 무료입니다.',
	},
	{
		q: '메일은 언제 오나요?',
		a: '매일 아침 8시 40분쯤, 구독한 분야를 엮은 메일 한 통이 옵니다. 분야를 여러 개 골라도 메일은 한 통입니다.',
	},
	{
		q: '어떤 분야를 고를 수 있나요?',
		a: 'IT · 정치 · 경제 · 사회 · 생활 · 세계, 6개 분야입니다. 구독한 뒤에도 마이페이지에서 언제든 바꿀 수 있습니다.',
	},
	{
		q: 'AI가 쓴 글을 그대로 믿어도 되나요?',
		a: '기사를 AI가 요약하고 다시 구성한 글입니다. 중요한 판단을 하기 전에는 기사 화면 아래의 관련 뉴스에서 원문을 확인해 주세요.',
	},
	{
		q: '구독을 멈추거나 그만두려면요?',
		a: '마이페이지에서 일시정지하거나 해지할 수 있고, 메일 아래쪽의 "수신 거부"로도 바로 멈출 수 있습니다.',
	},
	{
		q: '탈퇴하면 제 정보는 어떻게 되나요?',
		a: '마이페이지에서 바로 탈퇴할 수 있고, 계정 정보 · 구독 · 북마크 · 메일 발송 기록이 한 번에 지워집니다.',
	},
];

/** 자주 묻는 질문. 브라우저 기본 접기(details)라 키보드·화면 낭독기로도 열고 닫는다 */
export default function FaqSection() {
	return (
		<StyledFaq aria-label="자주 묻는 질문">
			<BorderTitle text="FAQ" />
			<div className="list">
				{FAQ.map(({ q, a }) => (
					<details key={q} className="item">
						<summary>
							<span>{q}</span>
							<LuPlus className="icon" aria-hidden />
						</summary>
						<p className="answer">{a}</p>
					</details>
				))}
			</div>
		</StyledFaq>
	);
}

const open = keyframes`
	from { opacity: 0; transform: translateY(-0.5rem); }
	to { opacity: 1; transform: none; }
`;

const StyledFaq = styled.section`
	.list {
		border-top: 1px solid ${({ theme }) => theme.color.text};
	}

	.item {
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		summary {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			padding: 1.375rem 0.25rem;
			cursor: pointer;
			list-style: none;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;

			&::-webkit-details-marker {
				display: none;
			}

			&:hover {
				color: ${({ theme }) => theme.color.primary};
			}

			&:focus-visible {
				outline: 2px solid ${({ theme }) => theme.color.primary};
				outline-offset: 2px;
			}
		}

		.icon {
			flex-shrink: 0;
			width: 1.25rem;
			height: 1.25rem;
			color: ${({ theme }) => theme.color.subText};
			transition: transform 0.3s ease;
		}

		.answer {
			margin: 0;
			padding: 0 0.25rem 1.5rem;
			line-height: 1.8;
			color: ${({ theme }) => theme.color.subText};
			word-break: keep-all;
		}

		&[open] {
			.icon {
				transform: rotate(45deg);
				color: ${({ theme }) => theme.color.primary};
			}

			.answer {
				animation: ${open} 0.35s ease;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.item .icon {
			transition: none;
		}

		.item[open] .answer {
			animation: none;
		}
	}
`;
