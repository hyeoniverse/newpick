import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTrends } from '@/hooks/useTrends';
import { filterByCategories } from '@/utils/queryNewsletters';
import { mapIdToTitle, mapTitleToId } from '@/utils/mapInterests';

import styled from 'styled-components';
import { IoIosArrowForward } from 'react-icons/io';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import BarWidth from '@/components/common/BarWidth';
import SummaryTextBox from '@/components/common/article/SummaryTextBox';
import Image from '@/components/common/Image';
import { LuNewspaper } from 'react-icons/lu';
import { SkeletonBlock } from '@/components/common/loader/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { errorStateFor } from '@/constants/errors';
// import OrigLinkIcon from '@/components/common/icons/OrigLinkIcon';
import { DEFAULT_IMAGES } from '@/constants/images';

function MySummaryCategory() {
	const { user } = useAuth();
	const { trends, isLoading, isError, refetch } = useTrends();

	const userInterests = mapIdToTitle(user?.interests ?? []);
	const userArticles = filterByCategories(trends, userInterests);

	// 불러오는 동안: 뉴스레터 한 편 모양(분야 · 제목 · 사진 + 요약)
	if (isLoading)
		return (
			<MySummaryCategoryStyled aria-busy>
				<div className="my-subs-content skeleton" aria-hidden>
					<SkeletonBlock $width="5rem" $height="0.875rem" />
					<SkeletonBlock $width="70%" $height="1.5rem" />
					<div className="skeleton-row">
						<SkeletonBlock $height="10rem" $radius="8px" />
						<SkeletonBlock $height="10rem" $radius="8px" />
					</div>
				</div>
			</MySummaryCategoryStyled>
		);
	if (isError) return <ErrorState inline {...errorStateFor(500)} onRetry={() => refetch()} />;

	return (
		<>
			<MySummaryCategoryStyled>
				{userArticles.length > 0 ? (
					userArticles.map((article) => {
						const categoryId = mapTitleToId([article.categoryName])[0].toString();
						return (
							<div
								key={article.id}
								className="my-subs-content"
								id={`section-${article.id}`}
								data-categoryid={categoryId}
							>
								<div className="top">
									<Link href={`/articles?categoryId=${categoryId}`} className="category-name">
										{article.categoryName}
										<IoIosArrowForward />
									</Link>
									<Link href={`/articles/detail/${article.id}`} className="title-section">
										<h2 className="title-text">{article.title}</h2>
									</Link>
								</div>
								<div className="bottom">
									<div className="img-section">
										<div className="image-placeholder">
											<Image src={article.image || DEFAULT_IMAGES.MONO} alt={article.title} />
										</div>
										<div className="etc">
											<BookmarkIcon newsId={article.id} newsletterId={article.id} />
											<LinkCopyIcon id={article.id} />
											{/* <OrigLinkIcon /> */}
										</div>
									</div>
									<SummaryTextBox flex={3} headingAs="h3">{article.summary}</SummaryTextBox>
								</div>
								<BarWidth width={'100%'} className="bar" />
							</div>
						);
					})
				) : (
					<>
						<EmptyState
							icon={LuNewspaper}
							title="오늘 내 관심사 뉴스레터가 아직 없어요"
							description="매일 아침 8시 40분에 발행돼요. 그동안 다른 관심사 뉴스레터를 둘러보세요."
							action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
						/>
					</>
				)}
			</MySummaryCategoryStyled>
		</>
	);
}

const MySummaryCategoryStyled = styled.div`
    .skeleton {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 2rem 0;

        .skeleton-row {
            display: grid;
            grid-template-columns: 1fr 3fr;
            gap: 1rem;
            margin-top: 0.5rem;
        }
    }

    @keyframes moveForward {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(0.375rem);
        }
    }

    .my-subs-content {
        height: 100%;
        max-width: 100%;
        margin-top: 5rem;
        scroll-margin-top: 7.4rem;

        .top {
            margin-top: 3.75rem;
            margin-bottom: 1.875rem;

            .category-name {
                font-size: ${({ theme }) => theme.fontSize.medium};
                font-weight: ${({ theme }) => theme.fontWeight.medium};
                margin-bottom: 1.25rem;
                color: ${({ theme }) => theme.color.primary};

                &:hover {
                    svg {
                        animation: moveForward .7s linear infinite;
                    }
                }
            }

            .title-section {
                display: flex;
                flex-direction: row;
                gap: 0.5rem;

                .title-text {
                    font-size: ${({ theme }) => theme.fontSize.large};
                    flex: 1;
                }
            }
        }

        .bottom {
            height: 100%;
            display: flex;
            flex-direction: row;
            gap: 1.25rem;

            .img-section {
                flex: 1;

                .image-placeholder {
                    width: 100%;
                    height: fit-content !important;
                    aspect-ratio: 16 / 9;
                    border-radius: ${({ theme }) => theme.radius.surface};
                    overflow: hidden;
                    background-color: ${({ theme }) => theme.color.surface};
                }

                .etc {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    gap: 1rem;
                    margin-top: 1rem;
                }
            }

            @media (max-width: 768px) {
                flex-direction: column;
                .text, .img-section {
                    flex: none; /* flex 비율 대신 각자 100% 너비 (혹은 auto) */
                    width: 100%;
                }

            }
        }
    }
}
`;

export default MySummaryCategory;
