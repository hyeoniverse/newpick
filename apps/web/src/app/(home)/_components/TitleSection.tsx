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
							className="image"
						/>
					</Link>
				))}
			</Marquee>
		</div>
	);
}

export default TitleSection;
