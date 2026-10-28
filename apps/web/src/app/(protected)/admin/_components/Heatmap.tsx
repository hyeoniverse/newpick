'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { chartTones } from '@/components/common/charts/TrendChart';
import { duration } from './trafficLabels';

export type Click = [number, number, string?];
type Mode = 'attention' | 'clicks';

interface Props {
	/** 띄울 실제 주소 (예: /articles/detail/66) */
	path: string;
	device: 'desktop' | 'tablet' | 'mobile';
	/** 문서 20칸 평균 머문 시간 (ms) */
	attention: number[];
	/** [가로 비율, 세로 비율, 구역] */
	clicks: Click[];
}

/** 기기마다 띄울 화면 너비 (수집기가 나눈 기준의 대표 너비) */
const FRAME_WIDTH = { desktop: 1280, tablet: 820, mobile: 390 };

/**
 * 히트맵 (#131): 실제 페이지를 iframe으로 띄우고 그 위에 머문 곳(문서 20칸마다 진하기) · 클릭(점 밀도)을 겹친다.
 * 페이지는 기록 위치를 문서 높이 비율로 남겨, 지금 화면 높이에 맞춰 그린다.
 * iframe 주소에 ?__notrack을 붙여 미리보기가 방문 기록에 들어가지 않게 한다
 */
export default function Heatmap({ path, device, attention, clicks }: Props) {
	const boxRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<HTMLIFrameElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [boxWidth, setBoxWidth] = useState(0);
	const [height, setHeight] = useState(1200);
	const [mode, setMode] = useState<Mode>('attention');
	const frameWidth = FRAME_WIDTH[device];
	const scale = boxWidth ? Math.min(1, boxWidth / frameWidth) : 1;
	const src = `${path}${path.includes('?') ? '&' : '?'}__notrack=1`;

	useEffect(() => {
		const box = boxRef.current;
		if (!box) return;
		const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
		observer.observe(box);
		return () => observer.disconnect();
	}, []);

	// 페이지가 데이터를 불러오며 길어지므로 몇 초 동안 높이를 따라간다 (같은 사이트라 안을 읽을 수 있다)
	useEffect(() => {
		setHeight(1200);
		let count = 0;
		const timer = window.setInterval(() => {
			const doc = frameRef.current?.contentDocument;
			if (doc?.documentElement) setHeight(Math.max(600, doc.documentElement.scrollHeight));
			if (++count > 20) window.clearInterval(timer);
		}, 500);
		return () => window.clearInterval(timer);
	}, [src, frameWidth]);

	// 클릭: 반투명 원을 겹쳐 많이 누른 곳일수록 진하게
	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;
		canvas.width = frameWidth;
		canvas.height = height;
		ctx.clearRect(0, 0, frameWidth, height);
		if (mode !== 'clicks') return;
		const color = getComputedStyle(canvas).getPropertyValue('--tone-b').trim() || '#d9480f';
		for (const [x, y] of clicks) {
			const cx = x * frameWidth;
			const cy = y * height;
			const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
			gradient.addColorStop(0, `${color}99`);
			gradient.addColorStop(1, `${color}00`);
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(cx, cy, 28, 0, Math.PI * 2);
			ctx.fill();
		}
	}, [clicks, mode, height, frameWidth]);

	const max = Math.max(1, ...attention);
	const busiest = attention.indexOf(Math.max(...attention));

	return (
		<StyledHeatmap>
			<div className="toolbar" role="group" aria-label="히트맵 보기">
				<button type="button" aria-pressed={mode === 'attention'} onClick={() => setMode('attention')}>
					머문 곳
				</button>
				<button type="button" aria-pressed={mode === 'clicks'} onClick={() => setMode('clicks')}>
					클릭 {clicks.length.toLocaleString()}번
				</button>
				<span className="legend">
					{mode === 'attention' ? (
						<>
							<i className="ramp" aria-hidden /> 진할수록 화면에 오래 보인 곳 (문서를 20칸으로 나눔)
						</>
					) : (
						<>
							<i className="dot" aria-hidden /> 진할수록 많이 누른 곳
						</>
					)}
				</span>
			</div>
			<div ref={boxRef} className="viewport" style={{ height: height * scale }}>
				<div
					className="stage"
					// 화면보다 좁은 기기(모바일)는 가운데에
					style={{
						width: frameWidth,
						height,
						left: Math.max(0, (boxWidth - frameWidth * scale) / 2),
						transform: `scale(${scale})`,
					}}
				>
					<iframe
						ref={frameRef}
						src={src}
						title={`${path} 미리보기`}
						width={frameWidth}
						height={height}
						tabIndex={-1}
					/>
					{mode === 'attention' && (
						<ol className="bands" aria-label="문서 20칸 평균 머문 시간">
							{attention.map((value, i) => (
								<li
									key={i}
									style={{ top: `${i * 5}%`, '--strength': value / max } as React.CSSProperties}
									className={i === busiest ? 'busiest' : undefined}
								>
									<span>
										{i * 5}~{i * 5 + 5}% · 평균 {duration(value)}
									</span>
								</li>
							))}
						</ol>
					)}
					<canvas ref={canvasRef} className="clicks" aria-hidden />
				</div>
			</div>
		</StyledHeatmap>
	);
}

const StyledHeatmap = styled.div`
	${chartTones}
	display: flex;
	flex-direction: column;
	gap: 0.75rem;

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;

		button {
			padding: 0.375rem 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.chip};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&[aria-pressed='true'] {
				border-color: ${({ theme }) => theme.color.primary};
				background: ${({ theme }) => theme.color.tertiary};
				color: ${({ theme }) => theme.color.primary};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			}
		}
	}

	.legend {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		.ramp {
			width: 3rem;
			height: 0.625rem;
			border-radius: 2px;
			background: linear-gradient(
				to right,
				color-mix(in srgb, var(--tone-a) 5%, transparent),
				color-mix(in srgb, var(--tone-a) 55%, transparent)
			);
		}

		.dot {
			width: 0.75rem;
			height: 0.75rem;
			border-radius: 50%;
			background: radial-gradient(var(--tone-b), transparent 70%);
		}
	}

	/* 실제 페이지를 줄여 담는 틀: 바깥 페이지에서 스크롤 */
	.viewport {
		position: relative;
		width: 100%;
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};
	}

	.stage {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
	}

	iframe {
		display: block;
		border: 0;
		/* 미리보기는 보기만: 눌러서 다른 곳으로 가지 않게 */
		pointer-events: none;
		background: ${({ theme }) => theme.color.background};
	}

	.bands,
	.clicks {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.bands li {
		position: absolute;
		left: 0;
		right: 0;
		height: 5%;
		background: color-mix(in srgb, var(--tone-a) calc(5% + var(--strength) * 50%), transparent);
		border-bottom: 1px solid color-mix(in srgb, var(--tone-a) 15%, transparent);

		span {
			position: absolute;
			top: 0.5rem;
			right: 0.75rem;
			padding: 0.25rem 0.5rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
			background: ${({ theme }) => theme.color.background};
			font-size: 0.875rem;
			color: ${({ theme }) => theme.color.text};
			font-variant-numeric: tabular-nums;
		}

		&.busiest span {
			border-color: var(--tone-a);
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}
	}
`;
