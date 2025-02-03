'use client';

import styled from 'styled-components';
import SummaryTextBox from '@/components/common/article/SummaryTextBox';
import PopularArticle from '@/app/articles/detail/[slug]/_components/PopularArticle';
import ArticleContent from '@/app/articles/detail/[slug]/_components/content/ArticleContent';
import PrevNextArticle from '@/app/articles/detail/[slug]/_components/PrevNextArticle';
import LatestArticle from '@/app/articles/detail/[slug]/_components/LatestArticle';
import MobileLikeLinkButton from '@/app/articles/detail/[slug]/_components/MobileLikeLinkButton';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import MoveButton from '@/components/common/MoveButton';
import { IoArrowBack } from 'react-icons/io5';
import Link from 'next/link';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import { useRouter } from 'next/navigation';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useEffect } from 'react';

interface Props {
	article: IArticleDetail;
	summary: string;
	content: string;
	popular: IArticleDetail[];
	latest: IArticleDetail[];
	newsId: number;
	prev: IArticleDetail | null;
	next: IArticleDetail | null;
}

function Article({ article, summary, content, popular, latest, newsId, prev, next }: Props) {
	const router = useRouter();
	const { categories, fetchCategories, getCategoryName } = useCategoryStore();

	useEffect(() => {
		if (Object.keys(categories).length === 0) {
			fetchCategories();
		}
	}, [categories, fetchCategories]);
	return (
		<>
			<TitleSectionStyled>
				<MoveButton onClick={() => router.back()} text="이전으로" frontIcon={<IoArrowBack />} />
				<div className="title-section">
					<Link href={`/articles/categories/${article.categoryId}`} className="category">
						{getCategoryName(article.categoryId)}
					</Link>
					<h1 className="title">{article.title}</h1>
					<p className="date">{article.createdAt}</p>
					<div className="icons">
						<BookmarkIcon newsId={article.id} newsletterId={article.id} />
						<LinkCopyIcon id={article.id} />
					</div>
				</div>
			</TitleSectionStyled>
			<ArticleStyled>
				<SummaryTextBox>{summary}</SummaryTextBox>
				<div className="content-section">
					<ArticleContent className="content" content={content} articleImage={article.imageUrl ?? ''} />
					<PopularArticle className="popular" popular={popular} />
				</div>
				<PrevNextArticle className="prev-next" prev={prev} next={next} />
				{/*<CommentsSection className="comments-section"/>*/}
				<LatestArticle className="latest" latest={latest} />
				<MobileLikeLinkButton className="icons" newsId={newsId} />
			</ArticleStyled>
		</>
	);
}

const ArticleStyled = styled.div`
	margin: 4rem 0;
	position: relative;
	width: 100%;
	height: auto;

	.content-section {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		gap: 2rem;
		margin: 2rem 0;

		.content {
			flex: 3;
		}

		.popular {
			flex: 1;
			margin-top: 2rem;
		}
	}

	.comments-section {
		margin: 4rem 0;
	}

	@media screen and ${({ theme }) => theme.mediaQuery.tablet} {
		display: flex;
		flex-direction: column;

		.content-section {
			flex-direction: column;

			.content {
				border-bottom: 1px solid ${({ theme }) => theme.color.border};
				margin-bottom: 2rem;
			}

			.popular {
				order: 4;
			}
		}
	}

	.induce {
		order: 1;
	}

	.prev-next {
		order: 2;
	}

	.latest {
		order: 3;
	}
`;

const TitleSectionStyled = styled.div`
	margin-top: 4rem;
	display: flex;
	flex-direction: column;
	border-bottom: 1px solid ${({ theme }) => theme.color.border};

	.title-section {
		text-align: center;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.25rem;
		margin: 1.25rem 0;

		.category {
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.medium};
		}

		.title {
			word-break: auto-phrase;
		}

		.icons {
			display: flex;
			flex-direction: row;
			gap: 1rem;
			justify-content: center;
			align-items: center;
			margin-top: 0.75rem;
		}

		.date {
			color: ${({ theme }) => theme.color.lightGrey};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}
	}
`;

export default Article;
