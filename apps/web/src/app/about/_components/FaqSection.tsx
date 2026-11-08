'use client';

import { useEffect, useRef, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { cx } from '@/styles/tw';

/** 답은 실제 동작 기준 (이용약관 요약·발송 예약·탈퇴 처리와 같은 내용) */
const FAQ = [
	{
		q: '정말 무료인가요?',
		a: '네. 뉴스레터 열람 · 구독 · 북마크 모두 무료입니다.',
	},
	{
		q: '메일은 언제 오나요?',
		a: '매일 아침 8시 40분쯤, 구독한 관심사를 엮은 메일 한 통이 옵니다. 관심사를 여러 개 골라도 메일은 한 통입니다.',
	},
	{
		q: '어떤 관심사를 고를 수 있나요?',
		a: 'IT · 정치 · 경제 · 사회 · 생활 · 세계, 6개 관심사입니다. 구독한 뒤에도 마이페이지에서 언제든 바꿀 수 있습니다.',
	},
	{
		q: 'AI가 쓴 글을 그대로 믿어도 되나요?',
		a: '기사를 AI가 요약하고 다시 구성한 글입니다. 중요한 판단을 하기 전에는 기사 화면 아래의 관련 뉴스에서 원문을 확인해 주세요.',
	},
	{
		q: '구독을 멈추거나 그만두려면요?',
		a: '마이페이지에서 일시정지하거나 해지할 수 있고, 메일 아래쪽의 "수신 거부"로도 바로 멈출 수 있습니다.',
	},
	{
		q: '탈퇴하면 제 정보는 어떻게 되나요?',
		a: '마이페이지에서 바로 탈퇴할 수 있고, 계정 정보 · 구독 · 북마크 · 메일 발송 기록이 한 번에 지워집니다.',
	},
];

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
		<StyledFaq data-track-section="about-faq" aria-label="자주 묻는 질문">
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
		</StyledFaq>
	);
}

const StyledFaq = ({ className, ...props }: React.ComponentProps<'section'>) => (
	<section className={cx('np-about-faq-section-faq', className)} {...props} />
);
