import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';
import { mapIdToTitle } from '@/utils/mapInterests';
import { DEFAULT_IMAGES } from '@/constants/images';
import Image from '@/components/common/Image';
import type { ArticleDetail } from '@/types/article';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

interface Props {
	articles: ArticleDetail[];
}

/** 최신 뉴스레터 카드 슬라이드 (Swiper). 본문 아래라 LatestArticle이 나중에 불러온다 (#292) */
export default function LatestSlider({ articles }: Props) {
	return (
		<Swiper
			modules={[Navigation]}
			spaceBetween={20}
			slidesPerView={1.3}
			navigation={{ nextEl: '.latest-next', prevEl: '.latest-prev' }}
			breakpoints={{
				426: { slidesPerView: 2, spaceBetween: 20 },
				1024: { slidesPerView: 3, spaceBetween: 24 },
			}}
		>
			{articles.map((article) => (
				<SwiperSlide key={article.id}>
					<Link href={ROUTES.article(article.id)} className="item">
						<span className="photo">
							<Image
								src={(article.imageUrl && getFirstImage(article.imageUrl)) || DEFAULT_IMAGES.MONO}
								alt=""
								ratio="wide"
								priority={false}
							/>
						</span>
						<span className="overlay">
							<span className="meta">
								<span className="category">{mapIdToTitle([article.categoryId])[0]}</span>
								<span aria-hidden>·</span>
								<span className="date">{dateFormatter(article.createdAt)}</span>
							</span>
							<span className="title">{article.title}</span>
						</span>
					</Link>
				</SwiperSlide>
			))}
		</Swiper>
	);
}
