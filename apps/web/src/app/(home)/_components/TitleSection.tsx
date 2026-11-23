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

/** 아래 판이 다 덮을 때 패널이 줄어드는 정도 (1 → 0.9) */
const SHRINK = 0.1;

/**
 * 아래 판이 패널을 얼마나 덮었는지 (0 ~ 1): 판의 위 끝이 패널의 위 끝에 닿으면 1.
 * @param scrolled 스크롤한 거리
 * @param distance 판이 패널 위 끝까지 올라오는 데 필요한 스크롤 거리 (처음 판 위치 − 패널이 멈춘 위치)
 */
export const coverProgress = (scrolled: number, distance: number) =>
	distance > 0 ? Math.min(1, Math.max(0, scrolled / distance)) : 0;

/**
 * 홈 첫 화면 패널 (로고 · 제목 · 설명 · 배너 두 줄).
 * - 시작 애니메이션: 로고가 'NP'에서 NewPick으로 펼쳐진 뒤 나머지가 차례로 나타난다 (CSS, 움직임 줄이기 설정이면 없음)
 * - 스크롤: 패널은 처음 자리에 그대로 멈춰 있고, 아래 칸(page.tsx의 np-home-cover)이 위로 올라와 덮는다.
 *   덮이는 만큼 패널은 작아지고 흐려져 사라진다 (움직임 줄이기 설정이면 흐려지기만)
 */
function TitleSection({ className, firstArticles, secondArticles }: Props) {
	const panel = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = panel.current;
		const cover = el?.nextElementSibling as HTMLElement | null;
		if (!el || !cover) return;
		const still = window.matchMedia('(prefers-reduced-motion: reduce)');
		let distance = 0;
		let frame = 0;

		const paint = () => {
			frame = 0;
			const p = coverProgress(window.scrollY, distance);
			el.style.opacity = String(1 - p);
			el.style.transform = still.matches || p === 0 ? '' : `scale(${1 - SHRINK * p})`;
		};
		// 멈출 자리 = 스크롤하지 않았을 때 패널의 위치 (머리글 · 위 여백 아래). 그 자리에서 바로 멈춰 움직이지 않는다
		const place = () => {
			el.style.top = '';
			el.style.position = 'relative';
			const top = el.getBoundingClientRect().top + window.scrollY;
			el.style.position = '';
			el.style.top = `${top}px`;
			distance = cover.getBoundingClientRect().top + window.scrollY - top;
			paint();
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(paint);
		};
		place();
		const observer = new ResizeObserver(place);
		observer.observe(el);
		window.addEventListener('resize', place);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(frame);
		};
	}, []);

	return (
		<div
			ref={panel}
			data-track-section="home-title"
			className={cx('np-home-title-section-title-section np-intro sticky top-0 z-0 origin-[50%_30%]', className)}
		>
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
