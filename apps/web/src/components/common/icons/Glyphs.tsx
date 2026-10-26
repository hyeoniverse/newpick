'use client';

import styled, { css, keyframes } from 'styled-components';

/**
 * 부분이 따로 움직이는 아이콘 (#63). 모양은 Lucide(ISC 라이선스, react-icons의 Lu 아이콘)와 같고,
 * 조각마다 class를 붙여 아이콘의 뜻에 맞게 움직인다.
 * 감싼 링크·버튼에 마우스를 올리거나 키보드로 오면 움직이고, 움직임 줄이기를 켠 사용자에게는 움직이지 않는다
 */

/** 감싼 a·button이 가리켜졌을 때 */
const whenActive = (rules: ReturnType<typeof css>) => css`
	:is(a, button):is(:hover, :focus-visible) & {
		${rules}
	}
`;

const Svg = styled.svg`
	width: 1em;
	height: 1em;
	overflow: visible;

	* {
		transform-box: fill-box;
		transform-origin: center;
		transition: transform 0.25s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		&,
		* {
			transition: none !important;
			animation: none !important;
			transform: none !important;
		}
	}
`;

const base = {
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
	'aria-hidden': true,
};

// ---------- 링크: 가운데 막대를 두고 ( ) 가 벌어진다 ----------

const LinkSvg = styled(Svg)`
	${whenActive(css`
		.left {
			transform: translateX(-2px);
		}
		.right {
			transform: translateX(2px);
		}
		.bar {
			transform: scaleX(1.15);
		}
	`)}
`;

export function LinkGlyph({ className }: { className?: string }) {
	return (
		<LinkSvg {...base} className={className}>
			<path className="left" d="M9 17H7A5 5 0 0 1 7 7h2" />
			<path className="right" d="M15 7h2a5 5 0 1 1 0 10h-2" />
			<line className="bar" x1="8" x2="16" y1="12" y2="12" />
		</LinkSvg>
	);
}

// ---------- 바깥 링크: 상자는 그대로, 화살표만 나가는 쪽으로 ----------

const ExternalSvg = styled(Svg)`
	${whenActive(css`
		.arrow {
			transform: translate(2px, -2px);
		}
	`)}
`;

export function ExternalGlyph({ className }: { className?: string }) {
	return (
		<ExternalSvg {...base} className={className}>
			<g className="arrow">
				<path d="M15 3h6v6" />
				<path d="M10 14 21 3" />
			</g>
			<path className="box" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		</ExternalSvg>
	);
}

// ---------- 북마크: 살짝 들리고, 켜면 위에서부터 색이 찬다 ----------

const BookmarkSvg = styled(Svg)<{ $filled: boolean }>`
	.fill {
		fill: currentColor;
		stroke: none;
		clip-path: inset(${({ $filled }) => ($filled ? '0 0 0 0' : '0 0 100% 0')});
		transition: clip-path 0.35s ease;
	}

	${whenActive(css`
		.ribbon {
			transform: translateY(-1.5px);
		}
	`)}

	@media (prefers-reduced-motion: reduce) {
		.fill {
			transition: none;
		}
	}
`;

const BOOKMARK = 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z';

export function BookmarkGlyph({ filled, className }: { filled: boolean; className?: string }) {
	return (
		<BookmarkSvg {...base} className={className} $filled={filled}>
			<g className="ribbon">
				<path className="fill" d={BOOKMARK} />
				<path d={BOOKMARK} />
			</g>
		</BookmarkSvg>
	);
}

// ---------- 공유: 점이 왼쪽 → 위 → 아래 차례로 켜지며 퍼진다 ----------

const pulse = keyframes`
	0%, 100% { transform: scale(1); }
	40% { transform: scale(1.35); }
`;

const ShareSvg = styled(Svg)`
	${whenActive(css`
		.node {
			animation: ${pulse} 0.5s ease both;
		}
		.n2 {
			animation-delay: 0.1s;
		}
		.n3 {
			animation-delay: 0.2s;
		}
	`)}
`;

export function ShareGlyph({ className }: { className?: string }) {
	return (
		<ShareSvg {...base} className={className}>
			<line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
			<line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
			<circle className="node n1" cx="6" cy="12" r="3" />
			<circle className="node n2" cx="18" cy="5" r="3" />
			<circle className="node n3" cx="18" cy="19" r="3" />
		</ShareSvg>
	);
}

// ---------- 체크: 붓으로 긋듯 그려진다 ----------

const draw = keyframes`
	from { stroke-dashoffset: 24; }
	to { stroke-dashoffset: 0; }
`;

const CheckSvg = styled(Svg)`
	path {
		stroke-dasharray: 24;
		animation: ${draw} 0.35s ease-out both;
	}
`;

export function CheckGlyph({ className }: { className?: string }) {
	return (
		<CheckSvg {...base} className={className}>
			<path d="M20 6 9 17l-5-5" />
		</CheckSvg>
	);
}
