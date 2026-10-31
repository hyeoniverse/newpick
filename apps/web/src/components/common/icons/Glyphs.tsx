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

/**
 * 누르면 바뀌는 단추(북마크 · 별)의 '누를 때 일 미리 보기'. 방금 눌러 바뀐 단추(data-settled)에서는
 * 마우스가 나갔다 다시 들어오기 전까지 미리 보기를 하지 않아, 바뀐 상태가 그대로 보인다.
 * 아이콘을 바로 감싼 단추를 가리킬 때만: 카드 전체가 링크인 곳(뉴스레터 배너 등)에서 카드만 가리켜도 미리 보기가 켜지지 않게
 */
const whenPreview = (rules: ReturnType<typeof css>) => css`
	button:is(:hover, :focus-visible):not([data-settled]) > & {
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

// ---------- 북마크: 켜면 위에서부터 색이 차고, 끄면 아래에서부터 빠진다. 가리키면 누를 때 일을 같은 방향으로 미리 (빈 것은 위가 조금 차고, 찬 것은 아래가 조금 빠진다) ----------

const BookmarkSvg = styled(Svg)<{ $filled: boolean }>`
	.fill {
		fill: currentColor;
		stroke: none;
		clip-path: inset(${({ $filled }) => ($filled ? '0 0 0 0' : '0 0 100% 0')});
		transition: clip-path 0.4s ease-in-out;
	}

	${({ $filled }) =>
		whenPreview(css`
			.fill {
				clip-path: inset(${$filled ? '0 0 35% 0' : '0 0 65% 0'});
				opacity: ${$filled ? 1 : 0.45};
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

// ---------- 별(중요 표시): 켜면 아래에서부터 차고, 끄면 위에서부터 빠진다. 가리키면 살짝 기울며 커지고, 누를 때 일을 같은 방향으로 미리 (빈 것은 아래가 조금 차고, 찬 것은 위가 조금 빠진다) ----------

const StarSvg = styled(Svg)<{ $filled: boolean }>`
	.fill {
		fill: currentColor;
		stroke: none;
		clip-path: inset(${({ $filled }) => ($filled ? '0 0 0 0' : '100% 0 0 0')});
		transition:
			clip-path 0.4s ease-in-out,
			opacity 0.2s ease;
	}

	${whenActive(css`
		.star {
			transform: rotate(-12deg) scale(1.12);
		}
	`)}

	${({ $filled }) =>
		whenPreview(css`
			.fill {
				clip-path: inset(${$filled ? '35% 0 0 0' : '65% 0 0 0'});
				opacity: ${$filled ? 1 : 0.45};
			}
		`)}

	@media (prefers-reduced-motion: reduce) {
		.fill {
			transition: none;
		}
	}
`;

const STAR =
	'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z';

/** 중요 표시 별 (켜면 아래에서부터 보라가 차오른다) */
export function StarGlyph({ filled, className }: { filled: boolean; className?: string }) {
	return (
		<StarSvg {...base} className={className} $filled={filled}>
			<g className="star">
				<path className="fill" d={STAR} />
				<path d={STAR} />
			</g>
		</StarSvg>
	);
}

// ---------- 공유: 왼쪽 점에서 선을 타고 오른쪽 두 점으로 전해진다 ----------

/** 선 길이(약 7.9)만큼 비워 두었다가 왼쪽 점 쪽부터 다시 그린다 */
const travel = keyframes`
	from { stroke-dashoffset: 8; }
	to { stroke-dashoffset: 0; }
`;

const arrive = keyframes`
	from { fill: transparent; }
	to { fill: currentColor; }
`;

const ShareSvg = styled(Svg)`
	.edge {
		stroke-dasharray: 8;
	}

	${whenActive(css`
		/* 1. 보내는 점(왼쪽)이 먼저 찬다 */
		.from {
			animation: ${arrive} 0.15s ease forwards;
		}
		/* 2. 선이 왼쪽 점에서 오른쪽으로 다시 그려진다 */
		.edge {
			animation: ${travel} 0.3s ease-out 0.1s both;
		}
		/* 3. 선이 닿으면 받는 점(오른쪽 둘)이 찬다 */
		.to {
			animation: ${arrive} 0.15s ease 0.38s forwards;
		}
	`)}
`;

export function ShareGlyph({ className }: { className?: string }) {
	return (
		<ShareSvg {...base} className={className}>
			{/* 두 선 모두 왼쪽 점 쪽에서 시작하게 좌표 순서를 맞췄다 (그려지는 방향) */}
			<line className="edge" x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
			<line className="edge" x1="8.59" y1="10.49" x2="15.41" y2="6.51" />
			<circle className="from" cx="6" cy="12" r="3" />
			<circle className="to" cx="18" cy="5" r="3" />
			<circle className="to" cx="18" cy="19" r="3" />
		</ShareSvg>
	);
}

// ---------- 종(후속 지켜보기): 가리키면 종이 흔들리고 추가 한 박자 늦게 따라간다. 끈 것은 +가 살짝 커지고, 켜면 한 번 울리며 양옆에 울림이 퍼진다 ----------

/** 꼭대기를 축으로 좌우로 흔들리다 멈춘다 */
const swing = keyframes`
	0% { transform: rotate(0); }
	20% { transform: rotate(14deg); }
	40% { transform: rotate(-10deg); }
	60% { transform: rotate(6deg); }
	80% { transform: rotate(-3deg); }
	100% { transform: rotate(0); }
`;

/** 추는 종보다 크게, 반대쪽으로 */
const knock = keyframes`
	0%, 100% { transform: translateX(0); }
	30% { transform: translateX(-1.5px); }
	55% { transform: translateX(1.5px); }
	80% { transform: translateX(-0.5px); }
`;

/** 울림이 바깥으로 퍼졌다 제자리로 */
const spread = keyframes`
	0% { opacity: 0; transform: translateX(0); }
	40% { opacity: 1; }
	60% { transform: translateX(var(--out)); }
	100% { opacity: 1; transform: translateX(0); }
`;

const BellSvg = styled(Svg)<{ $ring: boolean }>`
	.bell {
		transform-origin: 50% 0;
	}
	.wave-left {
		--out: -1.5px;
	}
	.wave-right {
		--out: 1.5px;
	}

	/* 눌러서 켠 순간 한 번 울린다 (이미 켜져 있던 것은 열 때마다 울리지 않게 ring으로 따로) */
	${({ $ring }) =>
		$ring &&
		css`
			.bell {
				animation: ${swing} 0.6s ease-out;
			}
			.clapper {
				animation: ${knock} 0.6s ease-out 0.05s;
			}
			.wave {
				animation: ${spread} 0.6s ease-out both;
			}
		`}

	${whenActive(css`
		.bell {
			animation: ${swing} 0.6s ease-out;
		}
		.clapper {
			animation: ${knock} 0.6s ease-out 0.05s;
		}
		.wave {
			animation: ${spread} 0.6s ease-out both;
		}
		.plus {
			transform: scale(1.25);
		}
	`)}
`;

/** 후속 지켜보기 종. 끈 것은 종 + (지켜보기 시작), 켠 것은 울리는 종 */
export function BellGlyph({ on, ring = false, className }: { on: boolean; ring?: boolean; className?: string }) {
	return (
		<BellSvg {...base} className={className} $ring={ring}>
			<g className="bell">
				<path
					d={
						on
							? 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'
							: 'M19.3 14.8C20.1 16.4 21 17 21 17H3s3-2 3-9c0-3.3 2.7-6 6-6 1 0 1.9.2 2.8.7'
					}
				/>
				<path className="clapper" d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
			</g>
			{on ? (
				<>
					<path className="wave wave-left" d="M4 2C2.8 3.7 2 5.7 2 8" />
					<path className="wave wave-right" d="M22 8c0-2.3-.8-4.3-2-6" />
				</>
			) : (
				<g className="plus">
					<path d="M15 8h6" />
					<path d="M18 5v6" />
				</g>
			)}
		</BellSvg>
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
