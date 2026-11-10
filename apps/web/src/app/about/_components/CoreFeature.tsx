'use client';

import { CATEGORY_NAMES } from '@newpick/shared';
import { useEffect, useState } from 'react';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

const CATEGORIES = CATEGORY_NAMES;

/** AI 큐레이션: 소식 한 꼭지가 요약 · 시사점 · 문답으로 써지고, 중요한 구절에 형광펜 */
function CurationDemo() {
	return (
		<div className="demo curation">
			<span className="chip">IT</span>
			<span className="title" />
			{['요약', '시사점', '문답'].map((label, i) => (
				<div key={label} className="part" style={{ '--i': i } as React.CSSProperties}>
					<span className="label">{label}</span>
					<span className="text">
						<span className="ink" />
						{i === 0 && <span className="mark" />}
					</span>
					<span className="text short">
						<span className="ink" />
					</span>
				</div>
			))}
		</div>
	);
}

/** 맞춤 구독: 관심사 칩이 하나씩 켜진다 (IT · 경제 · 세계) */
function SubscribeDemo() {
	const on = [0, 2, 5];
	return (
		<div className="demo subscribe">
			<div className="chips">
				{CATEGORIES.map((c, i) => (
					<span
						key={c}
						className={on.includes(i) ? 'chip-toggle on' : 'chip-toggle'}
						style={{ '--o': on.indexOf(i) } as React.CSSProperties}
					>
						{c}
					</span>
				))}
			</div>
			<p className="count">
				관심사 <strong>3개</strong>를 골랐습니다
			</p>
		</div>
	);
}

/** 자동 발송: 메일함 맨 위로 08:40 오늘의 뉴픽이 도착한다 */
function SendDemo() {
	return (
		<div className="demo send">
			<div className="mail new">
				<span className="dot" />
				<span className="from">NEWPICK</span>
				<span className="subject">오늘의 뉴픽</span>
				<span className="at">08:40</span>
			</div>
			{[0, 1, 2].map((i) => (
				<div key={i} className="mail old" style={{ '--i': i } as React.CSSProperties}>
					<span className="from-bar" />
					<span className="subject-bar" />
				</div>
			))}
		</div>
	);
}

const FEATURES = [
	{
		name: 'AI 큐레이션',
		headline: '필요한 것만 남기고,\n핵심만 정리.',
		text: '방대한 기사 중 중요한 소식만 고르고, 요약 · 시사점 · 문답으로 정리합니다.',
		Demo: CurationDemo,
	},
	{
		name: '맞춤 구독',
		headline: '내 관심사만.\n메일은 한 통.',
		text: '원하는 관심사만 고르면, 여러 개를 골라도 한 통으로 엮어 보냅니다.',
		Demo: SubscribeDemo,
	},
	{
		name: '자동 발송',
		headline: '찾아보지 않아도,\n아침 8시 40분.',
		text: '매일 아침 정해진 시간에 메일함으로 도착합니다.',
		Demo: SendDemo,
	},
];

/**
 * 기능 한 장 (화면 폭 하나). 왼쪽 이름 · 큰 한 문장 · 설명, 오른쪽 장면.
 * 한 번 화면 가운데에 온 장은 data-inview가 켜져 안의 움직임이 시작된다
 */
function FeaturePanel({
	name,
	headline,
	text,
	Demo,
	index,
	seen,
}: (typeof FEATURES)[number] & { index: number; seen: boolean }) {
	return (
		<li className="panel" data-inview={seen} aria-label={`${index + 1} / ${FEATURES.length} ${name}`}>
			<div className="copy">
				<p className="name">
					<span className="no">{String(index + 1).padStart(2, '0')}</span>
					{name}
				</p>
				<h3 className="headline">
					{headline.split('\n').map((line) => (
						<span key={line}>{line}</span>
					))}
				</h3>
				<p className="desc">{text}</p>
			</div>
			<div className="stage" aria-hidden>
				<Demo />
			</div>
		</li>
	);
}

/** 장마다 멈추는 지점: 진행도 0.08 → 0.92 사이를 장 수로 나눈 값 (.rail의 --moved와 같은 식) */
const STOPS = FEATURES.map((_, i) => 0.08 + (0.84 * i) / (FEATURES.length - 1));

/** 사용자의 스크롤 입력이 멈춘 뒤 이만큼 지나면 장에 맞춘다 */
const SNAP_IDLE_MS = 150;

/**
 * 장 단위 스크롤: 붙는 구간 안에서 사용자의 스크롤(휠 · 터치 · 키)이 멈추면 장에 맞춰 부드럽게 움직인다 (한 장씩 넘기는 느낌).
 * - 조금만 굴려도 한 장이 넘어간다: 입력 방향으로 지금 장을 지났으면 다음 장, 아니면 가까운 장
 * - scroll 이벤트가 아니라 입력 이벤트를 본다: 맞추는 동안 머리글이 접히고 펴지며 본문이 밀려 scroll이 계속 울리는데,
 *   그때마다 다시 맞추면 목표가 흔들려 제자리에 못 선다. 입력이 끝났을 때 한 번만 움직이고, 멈춘 뒤 남은 차이만 바로 맞춘다
 */
function useSnapToPanels(track: React.RefObject<HTMLDivElement | null>) {
	useEffect(() => {
		const el = track.current;
		if (!el) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let timer = 0;
		let settle = 0;
		// 이번 입력 묶음의 방향 (아래 +, 위 -). 휠은 deltaY, 터치는 손가락이 움직인 거리, 키는 방향키 · 페이지 키
		let direction = 0;
		let touchY = 0;
		const measure = () => {
			const rect = el.getBoundingClientRect();
			const distance = rect.height - window.innerHeight;
			if (distance <= 0) return null;
			return { progress: -rect.top / distance, distance };
		};
		const nearestIndex = (progress: number) =>
			STOPS.reduce((best, s, i) => (Math.abs(s - progress) < Math.abs(STOPS[best] - progress) ? i : best), 0);
		const offset = (dir: number) => {
			const m = measure();
			if (!m) return null;
			const { progress, distance } = m;
			// 붙는 구간 밖(앞뒤 멈춤 구간 포함)이면 그대로 둔다
			if (progress < 0 || progress > 1) return null;
			let index = nearestIndex(progress);
			// 입력 방향으로 가까운 장을 이미 지났으면 그다음 장으로
			if (dir > 0 && progress > STOPS[index] + 0.01) index = Math.min(STOPS.length - 1, index + 1);
			if (dir < 0 && progress < STOPS[index] - 0.01) index = Math.max(0, index - 1);
			return (STOPS[index] - progress) * distance;
		};
		const snap = () => {
			const delta = offset(Math.sign(direction));
			direction = 0;
			if (delta === null || Math.abs(delta) < 2) return;
			window.scrollBy({ top: delta, behavior: 'smooth' });
			window.clearTimeout(settle);
			settle = window.setTimeout(() => {
				const rest = offset(0);
				if (rest !== null && Math.abs(rest) >= 2) window.scrollBy({ top: rest, behavior: 'auto' });
			}, 700);
		};
		const input = (dy: number) => {
			direction += dy;
			window.clearTimeout(timer);
			timer = window.setTimeout(snap, SNAP_IDLE_MS);
		};
		const onWheel = (e: WheelEvent) => input(e.deltaY);
		const onTouchStart = (e: TouchEvent) => {
			touchY = e.touches[0]?.clientY ?? 0;
		};
		const onTouchEnd = (e: TouchEvent) => input(touchY - (e.changedTouches[0]?.clientY ?? touchY));
		const onKey = (e: KeyboardEvent) => {
			if (['ArrowDown', 'PageDown', ' '].includes(e.key)) input(1);
			else if (['ArrowUp', 'PageUp'].includes(e.key)) input(-1);
		};
		window.addEventListener('wheel', onWheel, { passive: true });
		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchend', onTouchEnd, { passive: true });
		window.addEventListener('keyup', onKey);
		return () => {
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchend', onTouchEnd);
			window.removeEventListener('keyup', onKey);
			window.clearTimeout(timer);
			window.clearTimeout(settle);
		};
	}, [track]);
}

/**
 * 핵심 기능: 화면 폭 회색 띠 + 붙는 가로 스크롤.
 * 섹션이 화면에 붙어 있는 동안 아래로 스크롤하면 기능 세 장이 옆으로 넘어간다
 * (track 높이 = 장 수 × 100vh, 처음 · 끝 8%는 멈춰 있는 구간). 스크롤이 멈추면 가까운 장으로 맞춘다 (useSnapToPanels)
 */
export default function CoreFeature() {
	const [active, setActive] = useState(0);
	const [seen, setSeen] = useState(1); // 몇 번째 장까지 보였는지
	const trackRef = useScrollProgress<HTMLDivElement>('pinned', (progress) => {
		const moved = Math.min(1, Math.max(0, (progress - 0.08) / 0.84));
		const index = Math.round(moved * (FEATURES.length - 1));
		setActive((prev) => (prev === index ? prev : index));
		setSeen((prev) => Math.max(prev, index + 1));
	});
	useSnapToPanels(trackRef);

	return (
		<section
			className="np-about-core-feature-core"
			data-track-section="about-core-feature"
			style={{ '--n': FEATURES.length } as React.CSSProperties}
		>
			<div className="inner">
				<SectionHeading label="CORE FEATURE" />
			</div>
			<div ref={trackRef} className="track">
				<div className="sticky-pane">
					<ol className="rail">
						{FEATURES.map((feature, i) => (
							<FeaturePanel key={feature.name} {...feature} index={i} seen={i < seen} />
						))}
					</ol>
					<div className="pager" aria-hidden>
						<span className="pager-count">
							{String(active + 1).padStart(2, '0')}{' '}
							<span className="of">/ {String(FEATURES.length).padStart(2, '0')}</span>
						</span>
						<span className="bars">
							{FEATURES.map((feature, i) => (
								<span key={feature.name} className={i === active ? 'bar on' : 'bar'} />
							))}
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}
