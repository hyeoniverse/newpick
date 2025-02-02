import styled from 'styled-components';
import { IoIosArrowForward } from 'react-icons/io';
import Link from 'next/link';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import BarWidth from '@/components/common/BarWidth';
import SummaryTextBox from '@/components/common/article/SummaryTextBox';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import { useAuthStore } from '@/stores/useAuthStore';
import { useArticleStore } from '@/stores/useMySubscribeStore';
import { useEffect } from 'react';
import { useCategoryStore } from '@/stores/useCategoryStore';

function MySummaryCategory() {
	const { user } = useAuthStore();
  const { userArticles, loading, error, fetchUserArticles } = useArticleStore();
	const { categories, fetchCategories, getCategoryName } = useCategoryStore();

	useEffect(() => {
		fetchUserArticles(user?.interests ?? []);
		// 카테고리 데이터가 아직 없으면 fetch (한 번만 실행됨)
		if (Object.keys(categories).length === 0) {
			fetchCategories();
		}
	}, [user?.interests, fetchUserArticles, categories, fetchCategories]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;


	return (
		<>
			<MySummaryCategoryStyled>
				{userArticles.length > 0 &&
					userArticles.map((article) => (
					<div key={article.id} className="my-subs-content" id={`section-${article.id}`} data-categoryid={article.categoryId}>
						<div className="top">
							<Link href="/mypage" className="category-name">
								{getCategoryName(article.categoryId)}
								<IoIosArrowForward />
							</Link>
							<Link href={`/articles/detail/${article.id}`} className="title-section">
								<h3 className="title-text">{article.title}</h3>
							</Link>
						</div>
						<div className="bottom">
							<div className="img-section">
								<HeightAutoImg src={article.imageUrl || null} height={'auto'} />
								<div className="etc">
									<BookmarkIcon newsId={article.id} newsletterId={article.id}/>
									<LinkCopyIcon id={article.id} />
									{/*<OrigLinkIcon />*/}
								</div>
							</div>
							<SummaryTextBox flex={3}>{article.content}</SummaryTextBox>
						</div>
						<BarWidth width={'100%'} className="bar" />
					</div>
				))}
			</MySummaryCategoryStyled>
		</>
	);
}

const MySummaryCategoryStyled = styled.div`
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
