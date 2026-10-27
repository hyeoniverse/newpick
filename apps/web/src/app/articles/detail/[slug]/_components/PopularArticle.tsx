import styled from 'styled-components';
import Link from 'next/link';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';
import { usePopularArticlesQuery } from '@/hooks/useArticle';
import { SkeletonBlock } from '@/components/common/loader/Skeleton';

interface Props {
	flex?: number;
	className?: string;
}

function PopularArticle({ flex, className }: Props) {

	const { data: popularArticles, isPending, isError, refetch } = usePopularArticlesQuery();

	return (
		<PopularNewsletterStyled flex={flex} className={className}>
			<h3 className="section-title">지금 인기 뉴스레터 TOP 5</h3>
			{/* 불러오는 중 · 실패 · 비어 있음 (#17). 옆 칸이라 작게 */}
			{isPending && (
				<ul className="popular-list" aria-hidden>
					{Array.from({ length: 5 }).map((_, index) => (
						<li key={index} className="skeleton">
							<SkeletonBlock $width="1rem" $height="1rem" />
							<span className="skeleton-text">
								<SkeletonBlock $width="90%" />
								<SkeletonBlock $width="40%" $height="0.75rem" />
							</span>
							<SkeletonBlock $width="3.25rem" $height="3.25rem" $radius="8px" />
						</li>
					))}
				</ul>
			)}
			{isError && (
				<p className="state">
					인기 뉴스레터를 불러오지 못했어요.{' '}
					<button type="button" className="retry" onClick={() => refetch()}>
						다시 시도
					</button>
				</p>
			)}
			{popularArticles?.length === 0 && <p className="state">아직 인기 뉴스레터가 없어요.</p>}
			<ul className="popular-list" hidden={!popularArticles?.length}>
				{popularArticles && popularArticles.map((article, index) => (
					<li key={index}>
						<p className="index">{index + 1}</p>
						<Link href={`/articles/detail/${article.id}`} className="text-section">
							<div>
								<p className="title">{article.title}</p>
								<p className="date">{dateFormatter(article.createdAt)}</p>
							</div>
						</Link>
						{article.imageUrl ? (
							<Link href={`/articles/detail/${article.id}`} className="thum-link">
								<HeightAutoImg src={getFirstImage(article.imageUrl)} aspectratio={1} />
							</Link>
						) : (
							<div className="thum-empty" />
						)}
					</li>
				))}
			</ul>
		</PopularNewsletterStyled>
	);
}

const PopularNewsletterStyled = styled.div<Omit<Props, 'popular'>>`
	/* display: flex라 hidden 속성이 안 먹으므로 직접 */
	.popular-list[hidden] {
		display: none;
	}

	.skeleton {
		align-items: center;

		.skeleton-text {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
			flex: 1;
		}
	}

	.state {
		padding: 1rem 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};

		.retry {
			padding: 0;
			font-size: inherit;
			color: ${({ theme }) => theme.color.primary};
			text-decoration: underline;
			cursor: pointer;
		}
	}

	position: sticky;
	overflow: auto;
	height: 100%;
	top: 4rem;

	.index {
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
	}

	.section-title {
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
		padding: 0 0 1rem 0;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
	}

	.popular-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 0 1rem 0;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		li {
			overflow: hidden;
			display: flex;
			flex-direction: row;
			gap: 1rem;

			.thum-link {
				flex: 1;
				height: fit-content;
				margin: 0;
			}

			.text-section {
				flex: 3;
				word-break: break-word;
				height: 4.25rem;

				.category {
					font-size: ${({ theme }) => theme.fontSize.extraSmall};
					color: ${({ theme }) => theme.color.primary};
					font-weight: ${({ theme }) => theme.fontWeight.medium};
				}

				.title {
					font-size: ${({ theme }) => theme.fontSize.small};
					font-weight: ${({ theme }) => theme.fontWeight.medium};

					overflow: hidden;
					text-overflow: ellipsis;

					display: -webkit-box;
					-webkit-line-clamp: 2; // 원하는 라인수
					-webkit-box-orient: vertical;
				}

				.date {
					font-size: ${({ theme }) => theme.fontSize.extraSmall};
					color: ${({ theme }) => theme.color.lightGrey};
				}
			}
		}

		li:hover .title {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	@media screen and ${({ theme }) => theme.mediaQuery.tablet} {
		display: flex;
		flex-direction: column;

		.section-title {
			border-top: none;
		}

		.popular-list {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			gap: 1.5rem;
			margin-bottom: 0;

			li {
				display: flex;
				flex-direction: row;
				align-items: stretch;
				flex: fit-content;

				.thum-link {
					flex: 1;
				}

				.thum-empty {
					flex: 1;
					aspect-ratio: 1;
					height: auto;
				}

				.text-section {
					flex: 5;
					justify-content: space-between;

					.title {
						height: 3rem;
					}
				}
			}
		}
	}

	@media screen and ${({ theme }) => theme.mediaQuery.mobile} {
		.thum-empty {
			display: none;
		}
	}
`;

export default PopularArticle;
