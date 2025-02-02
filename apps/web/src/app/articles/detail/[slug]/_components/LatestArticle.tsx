import styled from 'styled-components';
import Link from 'next/link';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import BarHeight from '@/components/common/BarHeight';
import { dateFormatter } from '@/utils/formatter';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { IArticleDetail } from '@/models/article.model';

interface Props {
	latest: IArticleDetail[];
	className?: string;
}

function LatestArticle({ latest, className }: Props) {
	return (
		<LatestArticleStyled className={className}>
			<div className="section-title">
				<h3>최신 아티클</h3>
			</div>
			<div className="swiper-container">
				<Swiper
					modules={[Navigation]}
					loop={true} // 슬라이드 루프
					spaceBetween={20} // 슬라이스 사이 간격
					slidesPerView={3} // 보여질 슬라이스 수
					navigation={{
						nextEl: '.swiper-button-next', // 다음 버튼
						prevEl: '.swiper-button-prev', // 이전 버튼
					}}
					breakpoints={{
						320: {
							// 375보다 클때
							slidesPerView: 2,
							spaceBetween: 20,
						},
						1024: {
							// 1024보다 클때
							slidesPerView: 3,
							spaceBetween: 20,
						},
					}}
				>
					<div className="arrow">
						<div className="swiper-button-prev" />
						<div className="swiper-button-next" />
					</div>
					{latest.map((article, index) => (
						<SwiperSlide key={index} className="swiper-slide">
							<Link href={`/articles/detail/${article.id}`}>
								<p className="title">{article.title}</p>
							</Link>
							<div className="bottom">
								<BookmarkIcon newsId={article.id} newsletterId={article.id} />
								<BarHeight height="1rem" margin="0.75rem" />
								<p className="date">{dateFormatter(article.createdAt)}</p>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</LatestArticleStyled>
	);
}

const LatestArticleStyled = styled.section`
    position: relative;
    padding: 3rem 0;
    margin: 4rem 0 -4.5rem 0;

    &::before {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 100vw;
        height: 100%;
        background-color: ${({ theme }) => theme.color.mediumGrey};
        transform: translateX(-50%);
        content: '';
        z-index: -1;
    }

    .section-title {
        margin-bottom: 1rem;

        h3 {
            font-size: ${({ theme }) => theme.fontSize.medium};
            font-weight: ${({ theme }) => theme.fontWeight.medium};
            color: ${({ theme }) => theme.color.background};
        }
    }
    
    .swiper-container {
        .swiper-slide {
            display: flex;
            flex-direction: column;
            
            .title {
                font-size: ${({ theme }) => theme.fontSize.medium};
                font-weight: ${({ theme }) => theme.fontWeight.medium};
                word-break: break-word;
                margin-bottom: 0.5rem;
                height: 3.25rem;

                overflow: hidden;
                text-overflow: ellipsis;

                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }

            .bottom {
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;

                .date {
                    font-size: ${({ theme }) => theme.fontSize.extraSmall};
                }
            }
        }
        .arrow {
            display: flex;
            flex-direction: row;
            gap: 2rem;
            margin-top: 1.25rem;

            .swiper-button-prev, .swiper-button-next {
                position: static;
                cursor: pointer;
                color: ${({ theme }) => theme.color.background};
                width: 1rem;
                height: 1rem;
                margin: 0;
                padding: 0;
                --swiper-navigation-size: 1rem;
            }
        }

        .swiper-slide {
            padding: 1rem;

            background-color: ${({ theme }) => theme.color.background};
            border-radius: ${({ theme }) => theme.borderRadius.soft};
            height: auto;

            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
        }
    }

    @media screen and ${({ theme }) => theme.mediaQuery.tablet} {
        margin: 2rem 0 -4.5rem 0;
    }
}

`;

export default LatestArticle;
