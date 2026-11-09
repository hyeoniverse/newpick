'use client';

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
	// 화면 아래에서 시작해 요소가 화면 가운데에 왔을 때 끝난다(center): 글자가 모이고 낱말이 밝아지는 것을 보면서 읽는 자리에서 멈춘다
	const designRef = useScrollProgress<HTMLDivElement>('center');
	const valuesRef = useScrollProgress<HTMLDivElement>('center');

	return (
		<section
			className="np-about-why-newpick-section-why"
			data-track-section="about-why-newpick"
			aria-label="WHY NEWPICK"
		>
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
		</section>
	);
}
