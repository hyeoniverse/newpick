'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { useTaste } from '@/hooks/useHighlights';

/** 보여 줄 주제 수 */
const SHOWN = 10;
/** 앞쪽 몇 개를 강조할지 */
const HIGHLIGHTED = 3;

/**
 * 마이페이지 '요즘 관심 있게 본 주제' (#123 2단계): 북마크 · 스크랩 · 메모로 모인 태그 점수를 태그 칩으로 짧게.
 * 점수 순서대로, 앞 3개는 강조. 앞으로 맞춤 뉴스레터가 이 주제를 먼저 챙긴다. 칩을 누르면 그 태그의 뉴스레터 목록으로
 * (점수 · 막대 · 출처 같은 계산 정보는 사용자 화면에 두지 않는다 — 관리자 통계에만)
 */
export default function MyTaste() {
	const { data } = useTaste();
	if (!data || data.topics.length === 0) return null;

	return (
		<StyledTaste aria-labelledby="my-taste">
			<div className="head">
				<h3 id="my-taste">요즘 관심 있게 본 주제</h3>
				<p>앞으로 맞춤 뉴스레터가 이 주제를 먼저 챙겨요.</p>
			</div>
			<ol>
				{data.topics.slice(0, SHOWN).map((t, i) => (
					<li key={t.topic}>
						<Link
							href={`/articles?keyword=${encodeURIComponent(t.topic)}`}
							className={i < HIGHLIGHTED ? 'chip top' : 'chip'}
						>
							#{t.topic}
						</Link>
					</li>
				))}
			</ol>
		</StyledTaste>
	);
}

const StyledTaste = styled.section`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1.125rem 1.25rem;
	border-radius: ${({ theme }) => theme.radius.surface};
	background: ${({ theme }) => theme.color.surface};

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;

		h3 {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		p {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
			word-break: keep-all;
		}
	}

	ol {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;

		/* 모바일은 두어 줄만: 앞 6개 */
		@media ${({ theme }) => theme.mediaQuery.mobile} {
			li:nth-child(n + 7) {
				display: none;
			}
		}
	}

	/* 태그 칩: 앞 3개는 주 색 바탕, 나머지는 테두리만 */
	.chip {
		display: inline-flex;
		align-items: center;
		height: 2rem;
		padding: 0 0.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.text};
		white-space: nowrap;

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.primary};
		}

		&.top {
			border-color: transparent;
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}
	}
`;
