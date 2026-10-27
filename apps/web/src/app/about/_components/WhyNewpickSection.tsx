'use client';

import styled from 'styled-components';
import BorderTitle from '@/components/common/BorderTitle';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/** 강조할 낱말은 ** 로 감싼다 */
const STATEMENT =
	'매일 쏟아지는 수많은 뉴스, 다 챙기기는 어렵습니다. NEWPICK은 그중 **내 관심사**의 **중요한 소식만** 골라, **읽기 좋게** 정리해 보내 드립니다.';

const VALUES = [
	{ title: '최신 트렌드', text: '그날 가장 많이 다뤄진 이슈를 놓치지 않도록' },
	{ title: '빠르고 정확하게', text: '요약 · 시사점 · 문답으로 짧게 읽어도 핵심을' },
	{ title: '더 깊이', text: '나만의 관심사를 매일 조금씩 더 깊이' },
];

const WORDS = STATEMENT.split(' ').map((word) => ({
	text: word.replaceAll('**', ''),
	strong: word.includes('**'),
}));

/**
 * WHY NEWPICK. 스크롤하는 동안 문장이 낱말 단위로 차례로 밝아진다 (--progress × 낱말 수 - 순서).
 * 글자는 처음부터 모두 들어 있어 화면 낭독기는 그대로 읽는다
 */
export default function WhyNewpickSection() {
	const ref = useScrollProgress<HTMLParagraphElement>('through');

	return (
		<StyledWhy aria-label="WHY NEWPICK">
			<BorderTitle text="WHY NEWPICK?" className="border-title" />
			<p ref={ref} className="statement" style={{ '--n': WORDS.length } as React.CSSProperties}>
				{WORDS.map((word, i) => (
					<span key={i} className={word.strong ? 'word strong' : 'word'} style={{ '--i': i } as React.CSSProperties}>
						{word.text}{' '}
					</span>
				))}
			</p>

			<ul className="values">
				{VALUES.map((value) => (
					<li key={value.title} className="value">
						<strong>{value.title}</strong>
						<span>{value.text}</span>
					</li>
				))}
			</ul>
		</StyledWhy>
	);
}

const StyledWhy = styled.section`
	word-break: keep-all;

	.border-title {
		margin-bottom: 2.5rem;
	}

	.statement {
		--progress: 0;
		max-width: 56rem;
		margin: 0;
		font-size: clamp(1.75rem, 4.2vw, 3.25rem);
		font-weight: 800;
		line-height: 1.4;
		letter-spacing: -0.02em;
		color: ${({ theme }) => theme.color.text};

		.word {
			opacity: clamp(0.18, calc(var(--progress) * var(--n) * 1.15 - var(--i)), 1);
		}

		.strong {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.values {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem;
		margin: 5rem 0 0;
		padding: 0;
		list-style: none;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 1rem;
			margin-top: 3rem;
		}
	}

	.value {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 1.25rem;
		border-top: 2px solid ${({ theme }) => theme.color.text};
		text-align: left;

		strong {
			font-size: ${({ theme }) => theme.fontSize.large};
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}

		span {
			line-height: 1.6;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.statement .word {
			opacity: 1;
		}
	}
`;
