'use client';

import { useEffect, useRef, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { ABOUT } from '@/copy';

/** 답은 실제 동작 기준 (이용약관 요약·발송 예약·탈퇴 처리와 같은 내용), 문구는 copy/marketing.ts */
const FAQ = ABOUT.faq;

/**
 * 자주 묻는 질문. 아래로 스크롤해 질문이 화면 위쪽 60% 안으로 들어오면 하나씩 펼쳐지고,
 * 위로 스크롤해 다시 그 선 아래로 내려가면 접힌다. 눌러서 직접 열고 닫을 수도 있다
 */
export default function FaqSection() {
	const [open, setOpen] = useState<boolean[]>(() => FAQ.map(() => false));
	const items = useRef<(HTMLLIElement | null)[]>([]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const index = items.current.indexOf(entry.target as HTMLLIElement);
					// 선보다 위로 올라왔으면 펼침, 선 아래로 다시 내려가면(위로 스크롤) 접힘.
					// 화면 위로 지나가 버린 질문은 펼친 채로 둔다
					const below = !entry.isIntersecting && entry.boundingClientRect.top > (entry.rootBounds?.bottom ?? 0);
					if (index < 0 || (!entry.isIntersecting && !below)) continue;
					setOpen((prev) => prev.map((v, i) => (i === index ? entry.isIntersecting : v)));
				}
			},
			{ rootMargin: '0px 0px -40% 0px' },
		);
		items.current.forEach((el) => el && observer.observe(el));
		return () => observer.disconnect();
	}, []);

	const toggle = (index: number) => setOpen((prev) => prev.map((v, i) => (i === index ? !v : v)));

	return (
		<section className="np-about-faq-section-faq" data-track-section="about-faq" aria-label="자주 묻는 질문">
			<SectionHeading label="FAQ" title="자주 묻는 질문" />
			<ul className="list">
				{FAQ.map(({ q, a }, i) => (
					<li
						key={q}
						ref={(el) => {
							items.current[i] = el;
						}}
						className="item"
						data-open={open[i]}
					>
						<button
							type="button"
							className="question"
							aria-expanded={open[i]}
							aria-controls={`faq-${i}`}
							onClick={() => toggle(i)}
						>
							<span>{q}</span>
							<LuPlus className="icon" aria-hidden />
						</button>
						{/* 높이를 0 → 내용 높이로 늘리는 grid 줄 전환 */}
						<div id={`faq-${i}`} className="panel" aria-hidden={!open[i]}>
							<div className="panel-inner">
								<p className="answer">{a}</p>
							</div>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
