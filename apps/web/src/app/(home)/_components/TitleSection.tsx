'use client';

import { HOME } from '@/copy';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { DEFAULT_IMAGES } from '@/constants/images';
import { ArticleDetail as IArticleDetail } from '@/types/article';
import { getFirstImage } from '@/utils/getFirstImage';

import { MorphLogo } from '@/components/common/icons/LogoSVG';
import Image from '@/components/common/Image';
import Marquee from '@/components/common/slider/Marquee';
import Title from '@/components/common/Title';
import { cx } from '@/styles/tw';
import { useEffect, useRef } from 'react';

interface Props {
	className?: string;
	firstArticles: IArticleDetail[];
	secondArticles: IArticleDetail[];
}

/**
 * 띠(Marquee)는 한 줄이 화면 너비보다 길어야 이음매 없이 흐릅니다 (모자라면 끝에 빈 자리가 지나감).
 * 뉴스레터는 하루 6개씩 쌓이므로, 배포 직후처럼 개수가 적으면 같은 목록을 반복해 채웁니다.
 */
const MIN_LOOP_SLIDES = 20;
/** 사진 칸 크기 (styles/pages/home.css .image-link 186px): 이 크기로 받아 휴대폰에서 큰 사진을 받지 않게 (#292) */
const MARQUEE_IMAGE = 186;
/** 첫 화면에 보이는 앞쪽 칸 수 (휴대폰 2~3칸 · PC 7~8칸): 이 칸들만 먼저 받고 바로 보인다 */
const PRIORITY_SLIDES = 4;
const fillForLoop = (articles: IArticleDetail[]) =>
	articles.length === 0 || articles.length >= MIN_LOOP_SLIDES
		? articles
		: Array.from({ length: Math.ceil(MIN_LOOP_SLIDES / articles.length) }, () => articles).flat();

/** 한 번 본 시작 애니메이션은 같은 탭(세션)에서 다시 틀지 않는다 */
export const INTRO_SEEN_KEY = 'np-intro-seen';
/** 시작 애니메이션 전체 길이 (styles/pages/home.css의 마지막 요소가 끝나는 때, ms) */
const INTRO_MS = 2000;
/**
 * 서버가 만든 HTML을 읽는 동안 바로 돈다 (그리기 전): 이번 세션에 이미 봤으면 html에 data-intro-seen을 달아 애니메이션을 끈다.
 * 다른 화면에서 홈으로 옮겨 올 때는 이 스크립트가 다시 돌지 않지만, html의 표시는 그대로 남아 있다
 */
const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}'))document.documentElement.dataset.introSeen='1'}catch(e){}`;

/**
 * 패널이 화면보다 길면 아래 끝이 화면 아래에 닿을 때부터 멈추도록 (짧으면 맨 위에서 멈춘다).
 * 그래야 배너 두 줄을 다 본 뒤에 아래 칸이 올라와 덮는다
 */
export const stickyTop = (viewport: number, panel: number) => Math.min(0, viewport - panel);

/**
 * 홈 첫 화면 패널 (로고 · 제목 · 설명 · 배너 두 줄).
 * - 시작 애니메이션: 로고가 'NP'에서 NewPick으로 펼쳐진 뒤 나머지가 차례로 나타난다 (CSS, 움직임 줄이기 설정이면 없음)
 * - 스크롤: 패널은 제자리에 멈춰 있고, 아래 칸(page.tsx의 np-home-cover)이 위로 올라와 덮는다
 */
function TitleSection({ className, firstArticles, secondArticles }: Props) {
	const panel = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = panel.current;
		if (!el) return;
		const place = () => {
			el.style.top = `${stickyTop(window.innerHeight, el.offsetHeight)}px`;
		};
		place();
		const observer = new ResizeObserver(place);
		observer.observe(el);
		window.addEventListener('resize', place);
		// 끝까지 본 뒤에는 같은 세션에서 다시 틀지 않는다
		const seen = window.setTimeout(() => {
			try {
				sessionStorage.setItem(INTRO_SEEN_KEY, '1');
			} catch {
				// 저장소를 못 쓰면 다음에도 튼다
			}
		}, INTRO_MS);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', place);
			window.clearTimeout(seen);
		};
	}, []);

	return (
		<div
			ref={panel}
			data-track-section="home-title"
			className={cx('np-home-title-section-title-section np-intro sticky top-0 z-0', className)}
		>
			<script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
			<MorphLogo className="logo" role="img" aria-label="NewPick" />
			<Title size="extraLarge" weight="medium" className="title-text">
				AI 뉴스레터 서비스 뉴픽
			</Title>
			<p>
				{HOME.heroLead}
				<br />
				{HOME.heroSub}
			</p>
			<Marquee dir="rtl">
				{fillForLoop(firstArticles).map((article, index) => (
					<Link key={`${article.id}-${index}`} href={ROUTES.article(article.id)} className="image-link">
						<Image
							src={getFirstImage(article.imageUrl || '') || DEFAULT_IMAGES.MONO}
							fallback={article.fallbackImageUrl}
							alt={article.title}
							ratio="square"
							width={MARQUEE_IMAGE}
							height={MARQUEE_IMAGE}
							priority={index < PRIORITY_SLIDES}
							className="image"
						/>
					</Link>
				))}
			</Marquee>
			<Marquee dir="ltr">
				{fillForLoop(secondArticles).map((article, index) => (
					<Link key={`${article.id}-${index}`} href={ROUTES.article(article.id)} className="image-link">
						<Image
							src={getFirstImage(article.imageUrl || '') || DEFAULT_IMAGES.MONO}
							fallback={article.fallbackImageUrl}
							alt={article.title}
							ratio="square"
							width={MARQUEE_IMAGE}
							height={MARQUEE_IMAGE}
							priority={index < PRIORITY_SLIDES}
							className="image"
						/>
					</Link>
				))}
			</Marquee>
		</div>
	);
}

export default TitleSection;
