'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { useTaste } from '@/hooks/useHighlights';

/** 보여 줄 주제 수 */
const SHOWN = 10;

/**
 * 마이페이지 '요즘 관심 있게 본 주제' (#123 2단계): 북마크 · 스크랩 · 메모로 모인 태그 점수.
 * 앞으로 맞춤 뉴스레터가 이 점수로 소식을 고른다. 태그를 누르면 그 태그의 뉴스레터 목록으로
 */
export default function MyTaste() {
	const { data } = useTaste();
	if (!data || data.topics.length === 0) return null;

	const top = data.topics.slice(0, SHOWN);
	const max = top[0].score || 1;
	const { weights, halfLifeDays, signals } = data;
	const total = signals.bookmark + signals.scrap + signals.memo;

	return (
		<StyledTaste aria-labelledby="my-taste">
			<div className="head">
				<h3 id="my-taste">요즘 관심 있게 본 주제</h3>
				<p>
					북마크 {signals.bookmark} · 스크랩 {signals.scrap} · 메모 {signals.memo}개에서 모았어요. 앞으로 맞춤
					뉴스레터가 이 주제를 먼저 챙겨요.
				</p>
			</div>
			<ol>
				{top.map((t) => (
					<li key={t.topic}>
						<Link href={`/articles?keyword=${encodeURIComponent(t.topic)}`} className="topic">
							#{t.topic}
						</Link>
						<span className="bar" aria-hidden>
							<span style={{ width: `${Math.max(4, (t.score / max) * 100)}%` }} />
						</span>
						<span className="from">
							{[t.memo && `메모 ${t.memo}`, t.scrap && `스크랩 ${t.scrap}`, t.bookmark && `북마크 ${t.bookmark}`]
								.filter(Boolean)
								.join(' · ')}
						</span>
					</li>
				))}
			</ol>
			{data.categories.length > 0 && (
				<p className="categories">
					관심사:{' '}
					{data.categories
						.filter((c) => c.name)
						.map((c) => `${c.name} ${Math.round((c.score / data.categories.reduce((s, x) => s + x.score, 0)) * 100)}%`)
						.join(' · ')}
				</p>
			)}
			<p className="how">
				{`점수: 북마크 ${weights.bookmark} · 스크랩 ${weights.scrap} · 메모 ${weights.memo}, 문장에 그 주제가 나오면 +1. ${halfLifeDays}일마다 절반으로 줄어 요즘 관심이 앞에 와요. (신호 ${total}개)`}
			</p>
		</StyledTaste>
	);
}

const StyledTaste = styled.section`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.25rem 1.5rem;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.surface};

	.head {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;

		h3 {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.medium};
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
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.625rem 2rem;
		margin: 0;
		padding: 0;
		list-style: none;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	li {
		display: grid;
		grid-template-columns: minmax(0, 9rem) 1fr;
		grid-template-areas:
			'topic bar'
			'topic from';
		align-items: center;
		gap: 0.25rem 0.75rem;
	}

	.topic {
		grid-area: topic;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.text};

		&:hover {
			color: ${({ theme }) => theme.color.primary};
			text-decoration: underline;
		}
	}

	.bar {
		grid-area: bar;
		height: 0.5rem;

		span {
			display: block;
			height: 100%;
			border-radius: 0 4px 4px 0;
			background: ${({ theme }) => theme.color.primary};
		}
	}

	.from {
		grid-area: from;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
	}

	.categories,
	.how {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	.how {
		padding-top: 0.75rem;
		border-top: 1px solid ${({ theme }) => theme.color.border};
	}
`;
