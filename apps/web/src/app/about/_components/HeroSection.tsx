'use client';

import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import { LuChevronRight } from 'react-icons/lu';
import Button from '@/components/common/Button';
import { useOpenSubscribe } from '@/hooks/useOpenSubscribe';
import { useScrollProgress } from '@/hooks/useScrollProgress';

const HEADLINE = ['내 관심사만 골라,', '매일 아침 한 통으로.'];

/** 메일 미리보기에 보이는 소식 (모양만 보여 주는 장식) */
const PREVIEW = [
	{ category: 'IT', title: '오늘 가장 많이 다뤄진 소식', lines: 3 },
	{ category: '경제', title: '같은 사건은 하나로 묶어서', lines: 3 },
	{ category: '세계', title: '요약 · 시사점 · 문답까지', lines: 2 },
];

/**
 * 시작하기 첫 화면. 열리면 제목 줄이 아래에서 차례로 올라오고,
 * 아래 메일 미리보기는 스크롤할수록 커지며 제자리로 올라온다 (--progress: 0 → 1)
 */
export default function HeroSection() {
	const router = useRouter();
	const openSubscribe = useOpenSubscribe();
	const stageRef = useScrollProgress<HTMLDivElement>('enter');

	return (
		<section className="np-about-hero-section-hero" data-track-section="about-hero">
			<p className="eyebrow">AI 뉴스 큐레이션 · NEWPICK</p>
			<h1 className="headline">
				{HEADLINE.map((line, i) => (
					<span key={line} className="line" style={{ '--i': i } as React.CSSProperties}>
						<span className={i === 0 ? 'mark' : undefined}>{line}</span>
					</span>
				))}
			</h1>
			<p className="lead">
				AI가 그날의 기사를 읽고 중요한 소식만 골라 요약합니다.
				<br className="desktop-only" /> 고른 관심사를 엮은 메일 한 통을 매일 아침 받아 보세요.
			</p>
			<div className="actions">
				<Button scheme="primary" size="large" onClick={() => openSubscribe()}>
					무료로 구독하기
				</Button>
				<button type="button" className="text-link" onClick={() => router.push(ROUTES.articles)}>
					뉴스레터 둘러보기 <LuChevronRight aria-hidden />
				</button>
			</div>

			<div ref={stageRef} className="stage" aria-hidden>
				<div className="mail">
					<div className="mail-bar">
						<span className="logo">NEWPICK</span>
						<span className="meta">오늘 08:40 · 관심사 3개</span>
					</div>
					<p className="mail-title">오늘의 뉴픽</p>
					<div className="stories">
						{PREVIEW.map((item, i) => (
							<div key={item.title} className="story" style={{ '--i': i } as React.CSSProperties}>
								<span className="chip">{item.category}</span>
								<p className="story-title">{item.title}</p>
								{Array.from({ length: item.lines }, (_, l) => (
									<span key={l} className="bar" />
								))}
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
