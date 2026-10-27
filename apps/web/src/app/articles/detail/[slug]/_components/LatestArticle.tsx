import styled from 'styled-components';
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
		<LatestArticleStyled className={className} aria-busy={isPending || undefined}>
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

const LatestArticleStyled = styled.section`
	position: relative;
	padding: 3rem 0 5.5rem;
	margin: 2rem 0 -4.5rem;
	color: #ffffff;

	/* 화면 폭 전체 어두운 띠 (라이트 · 다크 모드 모두 같은 색) */
	&::before {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: 100vw;
		height: 100%;
		background-color: #262626;
		transform: translateX(-50%);
		content: '';
		z-index: -1;
	}

	/* 제목 줄: 아래 옅은 선으로 카드와 나눈다 */
	.section-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.875rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.25);

		h3 {
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: #ffffff;
		}
	}

	.arrow {
		display: flex;
		gap: 0.5rem;

		button {
			width: 2rem;
			height: 2rem;
			border: 1px solid rgba(255, 255, 255, 0.5);
			cursor: pointer;
			color: #ffffff;

			&::before {
				display: block;
				font-size: 1rem;
				line-height: 1;
			}

			&:hover {
				border-color: #ffffff;
			}

			&.swiper-button-disabled {
				opacity: 0.3;
				cursor: default;
			}
		}

		.latest-prev::before {
			content: '‹';
		}

		.latest-next::before {
			content: '›';
		}
	}

	.skeleton-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		opacity: 0.35;

		@media ${({ theme }) => theme.mediaQuery.desktop} {
			grid-template-columns: repeat(2, 1fr);

			> :nth-child(3) {
				display: none;
			}
		}
	}

	/* 카드: 사진을 카드 전체로, 아래쪽 그라데이션 위에 관심사 · 날짜 → 제목(두 줄까지) */
	.item {
		position: relative;
		display: block;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
		color: #ffffff;
	}

	.photo {
		display: block;

		img {
			transition: transform 0.4s ease;
		}
	}

	.overlay {
		position: absolute;
		inset: auto 0 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 3rem 1rem 1rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.55) 55%, transparent 100%);
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: rgba(255, 255, 255, 0.8);
		font-variant-numeric: tabular-nums;
	}

	.category {
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: #ffffff;
	}

	.title {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		line-height: 1.45;
		word-break: keep-all;
		color: #ffffff;
	}

	.item:hover {
		.photo img {
			transform: scale(1.04);
		}

		.title {
			text-decoration: underline;
			text-underline-offset: 3px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.photo img {
			transition: none;
		}

		.item:hover .photo img {
			transform: none;
		}
	}
`;

export default LatestArticle;
