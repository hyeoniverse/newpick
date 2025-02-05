'use client';

import Link from 'next/link';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { DEFAULT_IMAGES } from '@/constants/images';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { getFirstImage } from '@/utils/getFirstImage';

import styled from 'styled-components';
import { PCLogo } from '@/components/common/svg/LogoSVG';
import Image from '@/components/common/Image';
import Title from '@/components/common/Title';

interface Props {
	className?: string;
	firstArticles: IArticleDetail[];
	secondArticles: IArticleDetail[];
}

function TitleSection({ className, firstArticles, secondArticles }: Props) {
	return (
		<TitleSectionStyled className={className}>
			<PCLogo className="logo" />
			<Title size="extraLarge" weight="medium" className="title-text">
				AI 뉴스레터 서비스 뉴픽
			</Title>
			<p>
				AI로 카테고리별 주요 뉴스를 아티클로 만들어 뉴스레터로 제공하고 있습니다.
				<br />
				뉴픽과 함께 시간의 가치와 지식의 채움을 누려보세요
			</p>
			<Swiper
				dir={'rtl'}
				modules={[Autoplay]}
				loop={true} // 슬라이드 루프
				spaceBetween={20} // 슬라이스 사이 간격
				slidesPerView={'auto'} // 보여질 슬라이스 수
				autoplay={{
					delay: 0,
					stopOnLastSlide: false,
					disableOnInteraction: false,
				}}
				observer={true}
				observeParents={true}
				loopAdditionalSlides={1}
				speed={4000}
			>
				{firstArticles.map((article) => (
					<SwiperSlide key={article.id} className="swiper-slide">
						<Link href={`/articles/detail/${article.id}`} className="image-link">
							<Image
								src={getFirstImage(article.imageUrl || '') || DEFAULT_IMAGES.MONO}
								alt={article.title}
								ratio="square"
								className="image"
							/>
						</Link>
					</SwiperSlide>
				))}
			</Swiper>
			<Swiper
				dir={'ltr'}
				modules={[Autoplay]}
				loop={true} // 슬라이드 루프
				spaceBetween={20} // 슬라이스 사이 간격
				slidesPerView={'auto'} // 보여질 슬라이스 수
				autoplay={{
					delay: 0,
					stopOnLastSlide: false,
					disableOnInteraction: false,
				}}
				observer={true}
				observeParents={true}
				loopAdditionalSlides={1}
				speed={4000}
			>
				{secondArticles.map((article) => (
					<SwiperSlide key={article.id} className="swiper-slide">
						<Link href={`/articles/detail/${article.id}`} className="image-link">
							<Image
								src={getFirstImage(article.imageUrl || '') || DEFAULT_IMAGES.MONO}
								alt={article.title}
								ratio="square"
								className="image"
							/>
						</Link>
					</SwiperSlide>
				))}
			</Swiper>
		</TitleSectionStyled>
	);
}

const TitleSectionStyled = styled.div`
	text-align: center;

	.logo {
		color: ${({ theme }) => theme.color.primary};
		height: 1.25rem;
		margin-bottom: 0.25rem;
	}

	.title-text {
		margin-bottom: 1rem;
	}

	p {
		margin-bottom: 4rem;
	}

	.swiper {
		width: 100vw;
		height: 100%;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		position: relative;
		overflow: hidden;
		margin-bottom: 2rem;

		.swiper-wrapper {
			transition-timing-function: linear !important;
			padding-right: calc(50% - 50vw);

			position: relative;
			display: flex;

			.swiper-slide {
				width: auto;

				.image-link {
					position: relative;
					display: block;
					height: 186px;
					width: 186px;
				}
			}
		}

		.image {
			border-radius: 12px;
		}
	}
`;

export default TitleSection;
