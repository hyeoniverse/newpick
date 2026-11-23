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
import { useStackPanel } from '@/hooks/useStackPanel';

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
/** 시작 애니메이션에서 로고에서 퍼져 나와 제 칸으로 날아가는 앞쪽 칸 수 (PC 첫 화면 7~8칸). 그 뒤 칸은 화면 밖이라 그냥 나타난다 */
export const FLY_SLIDES = 8;

/**
 * 시작 애니메이션: 칸마다 퍼져 나올 때의 기울기와 출발 차례.
 * 무작위 대신 순번으로 정해 서버 · 브라우저 화면이 같다
 */
export const flyFrom = (index: number, row: 0 | 1) => {
	const n = index + row * 3;
	return {
		'--fr': `${((n * 29) % 9) * 4 - 16}deg`,
		// 한 장씩 조금씩 늦게 출발
		'--i': String(index),
	} as React.CSSProperties;
};

/**
 * 출발점: 날아갈 사진마다 제 칸 가운데에서 로고 가운데까지의 거리 (--bx · --by).
 * 사진 칸 자리는 브라우저에서만 알 수 있어 잰다. 움직이는 사진이 아니라 그 바깥 칸(.slide)을 재서, 날아가는 중의 위치가 섞이지 않는다
 */
const placeFlights = (panel: HTMLElement) => {
	const logo = panel.querySelector('.logo');
	const photos = [...panel.querySelectorAll<HTMLElement>('.np-marquee .row:first-child [data-fly]')];
	if (!logo || !photos.length) return;
	const center = (el: Element) => {
		const r = el.getBoundingClientRect();
		return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
	};
	const from = center(logo);
	photos.forEach((photo) => {
		const slot = center(photo.parentElement ?? photo);
		photo.style.setProperty('--bx', `${from.x - slot.x}px`);
		photo.style.setProperty('--by', `${from.y - slot.y}px`);
	});
};

/** 사진이 날기 시작하기 조금 전 (home.css --np-intro-fly-start 1.2초) */
const FLY_REMEASURE_MS = 1100;

const fillForLoop = (articles: IArticleDetail[]) =>
	articles.length === 0 || articles.length >= MIN_LOOP_SLIDES
		? articles
		: Array.from({ length: Math.ceil(MIN_LOOP_SLIDES / articles.length) }, () => articles).flat();

/**
 * 새로고침이면 맨 위에서 시작한다: 서버 HTML을 읽는 동안(브라우저가 스크롤 자리를 되살리기 전) 돈다.
 * 되살리기를 잠깐 끄고 맨 위로 바로 올린 뒤(사이트의 부드러운 스크롤을 타지 않게 instant), 다 불러오면 다시 켠다 (다른 화면에서 '뒤로 가기'로 올 때는 지금처럼 보던 자리로)
 */
const RELOAD_TO_TOP_SCRIPT = `(function(){try{if(performance.getEntriesByType('navigation')[0]?.type!=='reload')return;history.scrollRestoration='manual';var toTop=function(){window.scrollTo({top:0,behavior:'instant'})};toTop();addEventListener('DOMContentLoaded',toTop,{once:true});addEventListener('load',function(){toTop();setTimeout(function(){history.scrollRestoration='auto'},0)},{once:true})}catch(e){}})()`;

/**
 * 홈 첫 화면 패널 (로고 · 제목 · 설명 · 배너 두 줄).
 * - 시작 애니메이션: 로고가 'NP'에서 NewPick으로 펼쳐진 뒤, 사진들이 로고에서 퍼져 나와 제 칸으로 날아가 띠가 되고 흐르기 시작한다.
 *   제목 · 설명은 사진이 거의 모였을 때 나타난다 (CSS, 움직임 줄이기 설정이면 없음)
 * - 새로고침하면 맨 위에서 시작한다 (시작 애니메이션부터 다시)
 * - 스크롤: 패널은 처음 자리에 그대로 멈춰 있고, 아래 칸(page.tsx의 np-home-cover)이 위로 올라와 덮는다.
 *   덮이는 만큼 패널은 작아지고 흐려져 사라진다 (useStackPanel)
 */
function TitleSection({ className, firstArticles, secondArticles }: Props) {
	const panel = useRef<HTMLDivElement>(null);

	useStackPanel(panel, 'start');

	useEffect(() => {
		const el = panel.current;
		if (!el) return;
		placeFlights(el);
		// 처음 그린 뒤 글꼴 · 스크롤 막대 등으로 칸 자리가 바뀔 수 있어, 사진이 날기 직전에 한 번 더 잰다
		const remeasure = window.setTimeout(() => placeFlights(el), FLY_REMEASURE_MS);
		return () => window.clearTimeout(remeasure);
	}, []);

	return (
		<div
			ref={panel}
			data-track-section="home-title"
			className={cx('np-home-title-section-title-section np-intro sticky top-0 z-0 origin-[50%_30%]', className)}
		>
			<script dangerouslySetInnerHTML={{ __html: RELOAD_TO_TOP_SCRIPT }} />
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
					<Link
						key={`${article.id}-${index}`}
						href={ROUTES.article(article.id)}
						className="image-link"
						data-fly={index < FLY_SLIDES ? '' : undefined}
						style={index < FLY_SLIDES ? flyFrom(index, 0) : undefined}
					>
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
					<Link
						key={`${article.id}-${index}`}
						href={ROUTES.article(article.id)}
						className="image-link"
						data-fly={index < FLY_SLIDES ? '' : undefined}
						style={index < FLY_SLIDES ? flyFrom(index, 1) : undefined}
					>
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
