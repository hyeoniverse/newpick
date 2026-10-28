'use client';

import styled from 'styled-components';
import BorderTitle from '@/components/common/BorderTitle';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/** 가치 문장 세 줄. 강조할 말은 ** 로 감싼다 */
const VALUES = [
	'**최신 트렌드**와 이슈를 놓치지 않도록',
	'**빠르고 정확하게** 뉴스를 습득할 수 있도록',
	'나만의 관심사를 **더 깊이 탐구**할 수 있도록',
];

/**
 * 문장을 낱말과 빈칸으로 나누고, 세 줄을 통틀어 몇 번째 낱말인지(--i) 붙인다.
 * 빈칸은 원래 자리에만 둔다 (강조한 말과 조사 사이에 빈칸이 생기지 않게: "최신 트렌드와")
 */
type Token = { text: string; strong: boolean; i: number } | { space: true };
const LINES: Token[][] = (() => {
	let index = 0;
	return VALUES.map((line) =>
		line.split(/(\*\*[^*]+\*\*)/).flatMap((part) => {
			const strong = part.startsWith('**');
			return part
				.replaceAll('**', '')
				.split(/(\s+)/)
				.filter(Boolean)
				.map((chunk): Token => (/^\s+$/.test(chunk) ? { space: true } : { text: chunk, strong, i: index++ }));
		}),
	);
})();
const WORD_COUNT = LINES.flat().filter((token) => !('space' in token)).length;

/**
 * WHY NEWPICK (처음 디자인). 소개 문단 → 큰 회색 VALUE PROPOSITION → 가운데 가치 문장 세 줄.
 * - VALUE PROPOSITION: 스크롤하면 넓게 벌어진 글자가 제자리로 모인다
 * - 가치 문장: 스크롤하는 동안 낱말 단위로 차례로 밝아진다 (첫 화면 다음 큰 문장과 같은 효과)
 */
export default function WhyNewpickSection() {
	const designRef = useScrollProgress<HTMLDivElement>('enter');
	const valuesRef = useScrollProgress<HTMLDivElement>('through');

	return (
		<StyledWhy data-track-section="about-why-newpick" aria-label="WHY NEWPICK">
			<BorderTitle text="WHY NEWPICK?" />
			<p className="sub-text">
				매일 새로운 소식, 중요한 소식이 쏟아지지만 모두 챙기기 힘드셨다면?
				<br />
				NEWPICK은 AI 큐레이션을 통해 원하는 관심사의 뉴스만 골라서
				<br />
				간편하고 빠르게 받아볼 수 있도록 도와드립니다.
			</p>
			<div ref={designRef} className="design-text" aria-hidden>
				VALUE PROPOSITION
			</div>
			<div ref={valuesRef} className="value-text" style={{ '--n': WORD_COUNT } as React.CSSProperties}>
				{LINES.map((tokens, line) => (
					<p key={line}>
						{tokens.map((token, k) => {
							if ('space' in token) return ' ';
							const style = { '--i': token.i } as React.CSSProperties;
							return token.strong ? (
								<strong key={k} className="word" style={style}>
									{token.text}
								</strong>
							) : (
								<span key={k} className="word" style={style}>
									{token.text}
								</span>
							);
						})}
					</p>
				))}
			</div>
		</StyledWhy>
	);
}

const StyledWhy = styled.section`
	.sub-text {
		line-height: 1.8;
		margin: 0 0 8rem;
		color: ${({ theme }) => theme.color.mediumGrey};
		word-break: keep-all;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			margin-bottom: 5rem;
		}
	}

	/* 좁은 화면에서 넘치지 않게 화면 폭에 맞춰 줄이고, 스크롤하면 0.3em → 0.12em으로 글자가 모인다 */
	.design-text {
		--progress: 0;
		font-size: clamp(1.75rem, 7vw, 5.125rem);
		font-weight: 800;
		color: ${({ theme }) => theme.color.neutral};
		letter-spacing: calc(0.3em - var(--progress) * 0.18em);
		text-align: center;
		white-space: nowrap;
		margin-bottom: 2rem;

		/* 좁은 화면은 벌어진 글자가 화면 밖으로 잘리므로 움직이지 않고 좁게 */
		@media ${({ theme }) => theme.mediaQuery.mobile} {
			letter-spacing: 0.06em;
		}
	}

	.value-text {
		--progress: 0;
		text-align: center;
		word-break: keep-all;

		p {
			font-size: 1.25rem;
			margin: 0 0 1rem;
			color: ${({ theme }) => theme.color.mediumGrey};

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				font-size: ${({ theme }) => theme.fontSize.medium};
			}
		}

		strong {
			color: ${({ theme }) => theme.color.text};
		}

		.word {
			opacity: clamp(0.2, calc(var(--progress) * var(--n) * 1.2 - var(--i)), 1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.design-text {
			letter-spacing: 0.12em;
		}

		.value-text .word {
			opacity: 1;
		}
	}
`;
