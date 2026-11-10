'use client';

import { CATEGORY_NAMES } from '@newpick/shared';
import { useState } from 'react';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/**
 * 서버 예약 작업 순서 그대로: 08:00 수집 → 08:30 AI 편집(고르기 → 쓰기) → 08:40 발송.
 * from → to는 그 단계를 지나는 동안 시계가 흘러가는 분 (스크롤에 맞춰 08:00 → 08:40)
 */
const STEPS = [
	{ from: 0, to: 30, title: '기사 모으기', text: '6개 관심사의 그날 기사가 쏟아져 들어옵니다.' },
	{
		from: 30,
		to: 30,
		title: '중요한 소식 고르기',
		text: '같은 사건은 한 묶음으로. AI가 제목과 첫 부분만 읽고 그날 중요한 소식을 고릅니다.',
	},
	{
		from: 30,
		to: 40,
		title: '뉴스레터 쓰기',
		text: '선별된 소식만 다시 읽고 요약 · 시사점 · Q&A를 작성합니다.',
	},
	{
		from: 40,
		to: 40,
		title: '내 메일 한 통',
		text: '내 관심사를 엮어 메일 한 통으로. 출근길에 뉴픽만 읽어도 그날의 소식은 끝.',
	},
];

const CATEGORIES = CATEGORY_NAMES;

/** 같은 사건 묶음의 자리 (무대 안 %). 0 · 2 · 3번 묶음이 뽑힌다 */
const CLUSTERS = [
	{ x: 22, y: 30 },
	{ x: 52, y: 18 },
	{ x: 78, y: 34 },
	{ x: 36, y: 72 },
	{ x: 70, y: 74 },
];
const PICKED = [0, 2, 3];

/**
 * 기사 카드 16장. 단계마다 자리(phase 0~3)를 미리 정해 두고, 단계가 바뀌면 CSS 전환으로 옮겨 간다.
 * 흩어진 자리는 고정된 의사 난수라 서버·클라이언트가 같다
 */
const CARDS = Array.from({ length: 16 }, (_, i) => {
	const cluster = i % CLUSTERS.length;
	const k = Math.floor(i / CLUSTERS.length); // 묶음 안 순서
	const row = PICKED.indexOf(cluster);
	return {
		category: CATEGORIES[(i * 7) % CATEGORIES.length],
		width: 70 + ((i * 37) % 30), // 제목 줄 길이 %
		picked: row >= 0,
		// 0: 흩어짐
		x0: 14 + ((i * 53) % 72),
		y0: 10 + ((i * 31 + 7) % 78),
		r0: ((i * 29) % 25) - 12,
		// 1: 사건별 묶음 (조금씩 어긋나게 겹침)
		x1: CLUSTERS[cluster].x + k * 1.5,
		y1: CLUSTERS[cluster].y + k * 3,
		r1: (k - 1) * 3,
		// 2: 뉴스레터 한 장의 줄 (뽑힌 묶음만)
		y2: row >= 0 ? 28 + row * 22 + k * 0.8 : CLUSTERS[cluster].y,
	};
});

const toClock = (minute: number) => `08:${String(Math.round(minute)).padStart(2, '0')}`;

/**
 * 스크롤 시퀀스 (붙는 장면): 장면이 화면에 붙어 있는 동안 스크롤하면 시계가 08:00 → 08:40으로 흐르고,
 * 한 무대 위의 기사 카드들이 흩어짐 → 사건별 묶음 → 뉴스레터 한 장 → 봉투 속 메일로 이어서 바뀐다
 */
export default function MorningSection() {
	const [state, setState] = useState({ active: 0, minute: 0 });
	const ref = useScrollProgress<HTMLDivElement>('pinned', (progress) => {
		const scaled = progress * STEPS.length;
		const active = Math.min(STEPS.length - 1, Math.floor(scaled));
		const { from, to } = STEPS[active];
		const minute = Math.round(from + (to - from) * Math.min(1, scaled - active));
		setState((prev) => (prev.active === active && prev.minute === minute ? prev : { active, minute }));
	});
	const { active, minute } = state;

	return (
		<section
			className="np-about-morning-section-morning"
			data-track-section="about-morning"
			aria-label="뉴스레터가 만들어지는 아침"
			style={{ '--steps': STEPS.length } as React.CSSProperties}
		>
			<SectionHeading
				label="08:00 → 08:40"
				title="뉴스레터가 만들어지는 아침 40분."
				sub="기사를 모으고, 고르고, 쓰고, 보내기까지. 스크롤하며 따라가 보십시오."
			/>

			<div ref={ref} className="track">
				<div className="scene" data-phase={active}>
					<div className="side">
						<p className="time" aria-hidden>
							{toClock(minute)}
						</p>

						{/* 네 단계 목록: 지금 단계만 진하게, 설명이 펼쳐진다 */}
						<ol className="captions">
							{STEPS.map((step, i) => (
								<li
									key={step.title}
									className="caption"
									data-active={i === active}
									data-done={i < active}
									aria-current={i === active ? 'step' : undefined}
								>
									<h3>
										<span className="no">{String(i + 1).padStart(2, '0')}</span>
										{step.title}
									</h3>
									<div className="detail">
										<p>{step.text}</p>
									</div>
								</li>
							))}
						</ol>
					</div>

					<div className="stage" aria-hidden>
						{/* 3단계에 깔리는 뉴스레터 한 장 */}
						<div className="sheet">
							<span className="sheet-title">오늘의 뉴픽</span>
						</div>
						{PICKED.map((c, row) => (
							<span key={c} className="sheet-lines" style={{ '--row': row } as React.CSSProperties}>
								<span />
								<span />
							</span>
						))}

						{CARDS.map((card, i) => (
							<span
								key={i}
								className={card.picked ? 'card picked' : 'card'}
								style={
									{
										'--i': i,
										'--x0': `${card.x0}%`,
										'--y0': `${card.y0}%`,
										'--r0': `${card.r0}deg`,
										'--x1': `${card.x1}%`,
										'--y1': `${card.y1}%`,
										'--r1': `${card.r1}deg`,
										'--y2': `${card.y2}%`,
										'--w': `${card.width}%`,
									} as React.CSSProperties
								}
							>
								<span className="chip">{card.category}</span>
								<span className="headline" />
							</span>
						))}

						{/* 4단계: 봉투 */}
						<div className="envelope">
							<span className="flap" />
							<span className="stamp">08:40</span>
							<span className="to">오늘의 뉴픽 · 내 관심사</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
