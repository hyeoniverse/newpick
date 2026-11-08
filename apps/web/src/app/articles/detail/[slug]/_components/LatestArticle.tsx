import Link from 'next/link';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';
import { mapIdToTitle } from '@/utils/mapInterests';
import { DEFAULT_IMAGES } from '@/constants/images';
import Image from '@/components/common/Image';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { useArticleListQuery } from '@/hooks/useArticle';
import { SkeletonBlock } from '@/components/common/loader/Skeleton';
import { cx } from '@/styles/tw';

interface Props {
	className?: string;
}

/**
 * 최신 뉴스레터: 화면 폭 전체 어두운 띠 위 사진 카드 슬라이드. 사진을 카드 전체로 깔고 아래쪽을 어둡게 해 그 위에 관심사 · 날짜 · 제목
 */
function LatestArticle({ className }: Props) {
	const { data: articleList, isPending, isError } = useArticleListQuery();

	// 본문 아래 덧붙이는 띠라, 실패하거나 비면 띠째 감춘다 (#17)
	if (isError || articleList?.length === 0) return null;

	return (
		<LatestArticleStyled className={className} aria-busy={isPending || undefined} data-track-section="detail-latest">
			<div className="section-title">
				<h3>최신 뉴스레터</h3>
				<div className="arrow">
					<button type="button" className="latest-prev" aria-label="이전 뉴스레터들" />
					<button type="button" className="latest-next" aria-label="다음 뉴스레터들" />
				</div>
			</div>
			{isPending ? (
				<div className="skeleton-row" aria-hidden>
					{Array.from({ length: 3 }).map((_, index) => (
						<SkeletonBlock key={index} $height="12rem" $radius="8px" />
					))}
				</div>
			) : (
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
					{articleList?.map((article) => (
						<SwiperSlide key={article.id}>
							<Link href={`/articles/detail/${article.id}`} className="item">
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
			)}
		</LatestArticleStyled>
	);
}

const LatestArticleStyled = ({ className, ...props }: React.ComponentProps<'section'>) => (
	<section className={cx('np-articles-latest-article-latest-article', className)} {...props} />
);

export default LatestArticle;
