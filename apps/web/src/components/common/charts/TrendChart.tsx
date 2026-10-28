'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

export interface TrendSeries {
	key: string;
	label: string;
	values: number[];
	/** 'b'는 두 번째 계열 색 (주황). 기본은 주 색 */
	tone?: 'a' | 'b';
	/** 기준선 아래로 그린다 (예: 해지 · 일시정지를 새 구독과 마주 보게) */
	below?: boolean;
}

interface Props {
	/** 'YYYY-MM-DD' 날짜들 (가로축) */
	dates: string[];
	series: TrendSeries[];
	kind: 'bar' | 'line';
	/** 그래프 이름 (화면 읽기 프로그램용) */
	label: string;
	format?: (value: number) => string;
	height?: number;
}

const PAD = { top: 16, right: 44, bottom: 24, left: 44 };

/** 0 · 1 · 2 · 5 · 10 … 깔끔한 눈금 간격 */
function niceStep(max: number, integer: boolean, ticks = 4) {
	if (max <= 0) return 1;
	// 사람 수 · 횟수처럼 정수만 있는 값은 0.5 같은 눈금을 만들지 않는다
	const raw = integer ? Math.max(1, max / ticks) : max / ticks;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const n = raw / mag;
	return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

const compact = (value: number) =>
	Math.abs(value) >= 1000 ? `${Number((value / 1000).toFixed(1))}K` : String(Number(value.toFixed(4)));

/** 위쪽(또는 아래쪽)만 4px 둥근 막대: 데이터 끝만 둥글고 기준선 쪽은 각지게 */
function barPath(x: number, w: number, y0: number, y1: number) {
	const h = Math.abs(y1 - y0);
	if (h < 0.5) return '';
	const r = Math.min(4, w / 2, h);
	if (y1 < y0) {
		return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
	}
	return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
}

/**
 * 날짜별 추이 그래프 (관리자 통계 #122). 막대(하루씩) 또는 꺾은선 하나, 세로축은 하나.
 * 계열이 둘 이상이면 위에 범례, 마우스를 올리면 그날 값을 말풍선으로. 라이브러리 없이 SVG로 그린다
 */
export default function TrendChart({ dates, series, kind, label, format = compact, height = 200 }: Props) {
	const boxRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(0);
	const [hover, setHover] = useState<number | null>(null);

	useEffect(() => {
		const box = boxRef.current;
		if (!box) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(box);
		return () => observer.disconnect();
	}, []);

	const up = series.filter((s) => !s.below);
	const down = series.filter((s) => s.below);
	const maxUp = Math.max(0, ...up.flatMap((s) => s.values));
	const maxDown = Math.max(0, ...down.flatMap((s) => s.values));
	const integer = series.every((s) => s.values.every(Number.isInteger));
	const step = niceStep(Math.max(maxUp, maxDown), integer);
	const top = Math.max(step, Math.ceil(maxUp / step) * step);
	const bottom = down.length ? Math.max(step, Math.ceil(maxDown / step) * step) : 0;

	const plotW = Math.max(0, width - PAD.left - PAD.right);
	const plotH = height - PAD.top - PAD.bottom;
	const y = (value: number) => PAD.top + ((top - value) / (top + bottom)) * plotH;
	const slot = dates.length ? plotW / dates.length : 0;
	const cx = (i: number) => PAD.left + slot * (i + 0.5);
	const barW = Math.max(2, Math.min(24, slot * 0.6));

	const ticks: number[] = [];
	for (let v = -bottom; v <= top + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
	// 가로축 날짜는 많아야 6개 정도만 (MM/DD)
	// 날짜 글자(MM/DD) 하나에 44px쯤: 좁은 화면에서는 더 듬성듬성
	const every = Math.max(1, Math.ceil(dates.length / 6), Math.ceil((44 * dates.length) / Math.max(plotW, 1)));

	const tooltipLeft = hover === null ? 0 : Math.min(Math.max(cx(hover), 80), Math.max(80, width - 80));

	return (
		<StyledChart>
			{series.length > 1 && (
				<ul className="legend">
					{series.map((s) => (
						<li key={s.key}>
							<span className={`swatch tone-${s.tone ?? 'a'}`} aria-hidden />
							{s.label}
						</li>
					))}
				</ul>
			)}
			<div ref={boxRef} className="plot" onMouseLeave={() => setHover(null)}>
				{width > 0 && (
					<svg width={width} height={height} role="img" aria-label={label}>
						{ticks.map((t) => (
							<g key={t}>
								<line
									className={t === 0 ? 'baseline' : 'grid'}
									x1={PAD.left}
									x2={width - PAD.right}
									y1={y(t)}
									y2={y(t)}
								/>
								<text className="tick" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
									{format(Math.abs(t))}
								</text>
							</g>
						))}
						{dates.map((date, i) =>
							// 마지막 날짜는 앞 눈금과 겹치지 않을 만큼 떨어져 있을 때만
							i % every === 0 || (i === dates.length - 1 && (i % every) * slot >= 44) ? (
								<text key={date} className="tick" x={cx(i)} y={height - 6} textAnchor="middle">
									{date.slice(5).replace('-', '/')}
								</text>
							) : null,
						)}
						{hover !== null && kind === 'line' && (
							<line className="crosshair" x1={cx(hover)} x2={cx(hover)} y1={PAD.top} y2={PAD.top + plotH} />
						)}

						{kind === 'bar' &&
							series.map((s) => {
								const w = up.length > 1 || down.length > 1 ? barW / Math.max(up.length, down.length) : barW;
								const group = s.below ? down : up;
								const offset = group.indexOf(s) * w - (w * group.length) / 2;
								return (
									<g key={s.key} className={`tone-${s.tone ?? 'a'}`}>
										{s.values.map((v, i) => (
											<path
												key={i}
												d={barPath(cx(i) + offset, w - (group.length > 1 ? 2 : 0), y(0), y(s.below ? -v : v))}
												opacity={hover === null || hover === i ? 1 : 0.45}
											/>
										))}
									</g>
								);
							})}

						{kind === 'line' &&
							series.map((s) => {
								const points = s.values.map((v, i) => `${cx(i)},${y(v)}`);
								const last = s.values.length - 1;
								return (
									<g key={s.key} className={`tone-${s.tone ?? 'a'}`}>
										<path className="area" d={`M${cx(0)},${y(0)}L${points.join('L')}L${cx(last)},${y(0)}Z`} />
										<path className="line" d={`M${points.join('L')}`} />
										{last >= 0 && (
											<>
												<circle className="dot" cx={cx(last)} cy={y(s.values[last])} r={4} />
												{/* 끝값만 바로 적는다 (나머지는 말풍선 · 표) */}
												<text className="end" x={cx(last) + 8} y={y(s.values[last])} dy="0.32em">
													{format(s.values[last])}
												</text>
											</>
										)}
										{hover !== null && <circle className="dot" cx={cx(hover)} cy={y(s.values[hover])} r={4} />}
									</g>
								);
							})}

						{/* 마우스를 받는 칸: 막대보다 넓게, 하루 칸 전체 */}
						{dates.map((date, i) => (
							<rect
								key={date}
								className="hit"
								x={PAD.left + slot * i}
								y={PAD.top}
								width={slot}
								height={plotH}
								onMouseEnter={() => setHover(i)}
							/>
						))}
					</svg>
				)}
				{hover !== null && (
					<div className="tooltip" style={{ left: tooltipLeft }} role="status">
						<strong>{dates[hover]}</strong>
						{series.map((s) => (
							<span key={s.key}>
								<i className={`swatch tone-${s.tone ?? 'a'}`} aria-hidden />
								{s.label} <b>{format(s.values[hover] ?? 0)}</b>
							</span>
						))}
					</div>
				)}
			</div>
		</StyledChart>
	);
}

/** 계열 색: 주 색(보라) · 주황. 어두운 테마는 같은 색상의 다른 단계 (색맹 · 대비 검사를 통과한 값) */
export const chartTones = `
	--tone-a: #3610e1;
	--tone-b: #d9480f;

	:root[data-theme='dark'] & {
		--tone-a: #7b86eb;
		--tone-b: #d9652a;
	}
`;

const StyledChart = styled.div`
	${chartTones}
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		li {
			display: flex;
			align-items: center;
			gap: 0.375rem;
		}
	}

	.swatch {
		display: inline-block;
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 2px;
		background: var(--tone-a);

		&.tone-b {
			background: var(--tone-b);
		}
	}

	.plot {
		position: relative;
		width: 100%;
		min-height: 1px;
	}

	svg {
		display: block;
		overflow: visible;
	}

	.grid {
		stroke: ${({ theme }) => theme.color.neutral};
		stroke-width: 1;
	}

	.baseline {
		stroke: ${({ theme }) => theme.color.border};
		stroke-width: 1;
	}

	.crosshair {
		stroke: ${({ theme }) => theme.color.border};
		stroke-width: 1;
	}

	.tick,
	.end {
		font-size: 0.6875rem;
		fill: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;
	}

	.end {
		fill: ${({ theme }) => theme.color.text};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
	}

	.tone-a {
		--tone: var(--tone-a);
	}

	.tone-b {
		--tone: var(--tone-b);
	}

	g path {
		fill: var(--tone);
		transition: opacity 0.1s;
	}

	g .line {
		fill: none;
		stroke: var(--tone);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	g .area {
		fill: var(--tone);
		opacity: 0.1;
	}

	.dot {
		fill: var(--tone);
		stroke: ${({ theme }) => theme.color.background};
		stroke-width: 2;
	}

	.hit {
		fill: transparent;
	}

	.tooltip {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.625rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.control};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.text};
		white-space: nowrap;
		pointer-events: none;

		span {
			display: flex;
			align-items: center;
			gap: 0.375rem;
		}

		b {
			margin-left: auto;
			padding-left: 0.75rem;
			font-variant-numeric: tabular-nums;
		}
	}
`;
