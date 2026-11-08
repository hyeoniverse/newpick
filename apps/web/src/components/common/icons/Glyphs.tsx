'use client';

import { cx } from '@/styles/tw';

/**
 * 부분이 따로 움직이는 아이콘 (#63). 모양은 Lucide(ISC 라이선스, react-icons의 Lu 아이콘)와 같고,
 * 조각마다 class를 붙여 아이콘의 뜻에 맞게 움직인다.
 * 감싼 링크·버튼에 마우스를 올리거나 키보드로 오면 움직이고, 움직임 줄이기를 켠 사용자에게는 움직이지 않는다.
 * 모양 · 움직임은 styles/glyphs.css (아이콘마다 np-glyph + 종류 클래스)
 */

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

export function LinkGlyph({ className }: { className?: string }) {
	return (
		<svg {...base} className={cx('np-glyph np-glyph-link', className)}>
			<path className="left" d="M9 17H7A5 5 0 0 1 7 7h2" />
			<path className="right" d="M15 7h2a5 5 0 1 1 0 10h-2" />
			<line className="bar" x1="8" x2="16" y1="12" y2="12" />
		</svg>
	);
}

// ---------- 바깥 링크: 상자는 그대로, 화살표만 나가는 쪽으로 ----------

export function ExternalGlyph({ className }: { className?: string }) {
	return (
		<svg {...base} className={cx('np-glyph np-glyph-external', className)}>
			<g className="arrow">
				<path d="M15 3h6v6" />
				<path d="M10 14 21 3" />
			</g>
			<path className="box" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		</svg>
	);
}

// ---------- 북마크: 켜면 위에서부터 색이 차고, 끄면 아래에서부터 빠진다. 가리키면 누를 때 일을 같은 방향으로 미리 (빈 것은 위가 조금 차고, 찬 것은 아래가 조금 빠진다) ----------

const BOOKMARK = 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z';

export function BookmarkGlyph({ filled, className }: { filled: boolean; className?: string }) {
	return (
		<svg {...base} className={cx('np-glyph np-glyph-bookmark', className)} data-filled={filled || undefined}>
			<g className="ribbon">
				<path className="fill" d={BOOKMARK} />
				<path d={BOOKMARK} />
			</g>
		</svg>
	);
}

// ---------- 별(중요 표시): 켜면 아래에서부터 차고, 끄면 위에서부터 빠진다. 가리키면 살짝 기울며 커지고, 누를 때 일을 같은 방향으로 미리 (빈 것은 아래가 조금 차고, 찬 것은 위가 조금 빠진다) ----------

const STAR =
	'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z';

/** 중요 표시 별 (켜면 아래에서부터 보라가 차오른다) */
export function StarGlyph({ filled, className }: { filled: boolean; className?: string }) {
	return (
		<svg {...base} className={cx('np-glyph np-glyph-star', className)} data-filled={filled || undefined}>
			<g className="star">
				<path className="fill" d={STAR} />
				<path d={STAR} />
			</g>
		</svg>
	);
}

// ---------- 공유: 왼쪽 점에서 선을 타고 오른쪽 두 점으로 전해진다 ----------

export function ShareGlyph({ className }: { className?: string }) {
	return (
		<svg {...base} className={cx('np-glyph np-glyph-share', className)}>
			{/* 두 선 모두 왼쪽 점 쪽에서 시작하게 좌표 순서를 맞췄다 (그려지는 방향) */}
			<line className="edge" x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
			<line className="edge" x1="8.59" y1="10.49" x2="15.41" y2="6.51" />
			<circle className="from" cx="6" cy="12" r="3" />
			<circle className="to" cx="18" cy="5" r="3" />
			<circle className="to" cx="18" cy="19" r="3" />
		</svg>
	);
}

// ---------- 종(후속 지켜보기): 가리키면 종이 흔들리고 추가 한 박자 늦게 따라간다. 끈 것은 +가 살짝 커지고, 켜면 한 번 울리며 양옆에 울림이 퍼진다 ----------

/** 후속 지켜보기 종. 끈 것은 종 + (지켜보기 시작), 켠 것은 울리는 종 */
export function BellGlyph({ on, ring = false, className }: { on: boolean; ring?: boolean; className?: string }) {
	return (
		<svg {...base} className={cx('np-glyph np-glyph-bell', className)} data-ring={ring || undefined}>
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
		</svg>
	);
}

// ---------- 체크: 붓으로 긋듯 그려진다 ----------

export function CheckGlyph({ className }: { className?: string }) {
	return (
		<svg {...base} className={cx('np-glyph np-glyph-check', className)}>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}
