'use client';

import { HOME } from '@/copy';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { DEFAULT_IMAGES } from '@/constants/images';
import { ArticleDetail as IArticleDetail } from '@/types/article';
import { getFirstImage } from '@/utils/getFirstImage';

import { PCLogo } from '@/components/common/icons/LogoSVG';
import Image from '@/components/common/Image';
import Marquee from '@/components/common/slider/Marquee';
import Title from '@/components/common/Title';
import { cx } from '@/styles/tw';

interface Props {
	className?: string;
	firstArticles: IArticleDetail[];
	secondArticles: IArticleDetail[];
}

/**
 * loop 모드는 화면 너비를 채우고도 남는 슬라이드가 있어야 동작합니다. (Swiper 12부터 모자라면 loop를 끄고 빈 자리가 남음)
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

function TitleSection({ className, firstArticles, secondArticles }: Props) {
	return (
		<div data-track-section="home-title" className={cx('np-home-title-section-title-section', className)}>
			<PCLogo className="logo" />
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
