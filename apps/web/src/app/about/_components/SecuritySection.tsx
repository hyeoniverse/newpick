'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { LuArrowUpRight } from 'react-icons/lu';
import { ABOUT } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { GITHUB } from '@/content/about';
import ExternalLink from '@/components/common/ExternalLink';
import BorderTitle from '@/components/common/BorderTitle';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/** 자세한 보안 설계 문서 (저장소의 docs/security.md) */
export const SECURITY_DOC = `${GITHUB.REPO}/blob/main/docs/security.md`;

const STEPS = ABOUT.security.steps;
const LAST = STEPS.length - 1;

type StepState = 'passed' | 'active' | 'ahead';
const stateOf = (i: number, active: number): StepState => (i < active ? 'passed' : i === active ? 'active' : 'ahead');
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 시작하기 '내 정보, 이렇게 지킵니다': 화면에 붙는(sticky) 장면. 스크롤하는 동안 여섯 장면으로 바뀐다.
 * 장면마다 화면을 채우는 큰 숫자(IN NUMBERS · 08:00과 같은 글자 중심)와 설명, 뒤에 옅은 영문 이름.
 * 아래 색인은 지금 위치를 보여 주고, 누르면 그 장면으로 스크롤한다.
 * 문구는 copy/marketing.ts, 자세한 설계는 docs/security.md
 */
export default function SecuritySection() {
	const { title, privacy, detail } = ABOUT.security;
	const [active, setActive] = useState(0);
	// 진행도(0~1)를 여섯 칸으로 나눠 장면 번호로. 같은 번호면 React가 다시 그리지 않는다
	const onProgress = useCallback((progress: number) => {
		setActive(Math.min(LAST, Math.floor(progress * STEPS.length)));
	}, []);
	const trackRef = useScrollProgress<HTMLDivElement>('pinned', onProgress);

	/** 색인 i를 누르면: 붙는 구간에서 i번째 칸의 가운데로 스크롤 */
	const goTo = (i: number) => {
		const track = trackRef.current;
		if (!track) return;
		const top = track.getBoundingClientRect().top + window.scrollY;
		const distance = track.offsetHeight - window.innerHeight;
		window.scrollTo({
			top: top + (distance * (i + 0.5)) / STEPS.length,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
		});
	};

	return (
		<section id="about-security" className="np-about-security-section-security" data-track-section="about-security">
			<div className="track" ref={trackRef} style={{ '--n': STEPS.length } as React.CSSProperties}>
				<div className="stage" style={{ '--active': active } as React.CSSProperties}>
					{/* 뒤에 깔리는 큰 영문 이름 (VALUE PROPOSITION처럼 옅게) */}
					<div className="backwords" aria-hidden>
						{STEPS.map(({ ring, en }, i) => (
							<span key={ring} className="backword" data-state={stateOf(i, active)}>
								{en}
							</span>
						))}
					</div>

					<div className="top">
						<BorderTitle text="SECURITY" as="p" className="border-title" />
						<h2 className="heading">{title}</h2>
					</div>

					<div className="figures" aria-hidden>
						{STEPS.map(({ ring, figure }, i) => (
							<p key={ring} className="figure" data-state={stateOf(i, active)}>
								<span className="value">{figure.value}</span>
								<span className="unit">{figure.unit}</span>
								<span className="caption">{figure.caption}</span>
							</p>
						))}
					</div>

					{/* 장면 글: 모두 그려 두고 지금 장면만 보인다 (화면 읽기 프로그램은 목록으로 모두 읽는다) */}
					<ol className="steps">
						{STEPS.map(({ ring, title: stepTitle, text }, i) => (
							<li key={ring} className="step" data-state={stateOf(i, active)}>
								<p className="ring-name">{ring}</p>
								<h3 className="step-title">{stepTitle}</h3>
								<p className="step-text">{text}</p>
							</li>
						))}
					</ol>

					{/* 아래 색인: 여섯 겹의 이름과 지금 위치. 화면에 붙어 있어 내려도 계속 보이고, 누르면 그 장면으로 */}
					<nav className="index" aria-label="보안 단계">
						{STEPS.map(({ ring }, i) => (
							<button
								key={ring}
								type="button"
								className="index-item"
								data-state={stateOf(i, active)}
								aria-current={i === active ? 'step' : undefined}
								onClick={() => goTo(i)}
							>
								<span className="index-no">{pad(i + 1)}</span>
								<span className="index-name">{ring}</span>
							</button>
						))}
					</nav>

					{/* 문서 · 처리방침 링크: 장면과 함께 붙어 있어 어느 장면에서든 바로 누를 수 있다 (오른쪽 아래 이동 단추와 겹치지 않게 왼쪽 맨 아래) */}
					<p className="links">
						<ExternalLink href={SECURITY_DOC} showIcon={false} className="link primary">
							{detail}
							<LuArrowUpRight aria-hidden />
						</ExternalLink>
						<Link href={ROUTES.privacy} className="link">
							{privacy}
							<LuArrowUpRight aria-hidden />
						</Link>
					</p>
				</div>
			</div>
		</section>
	);
}
