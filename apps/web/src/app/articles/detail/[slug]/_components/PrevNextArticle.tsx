'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { IoArrowUp, IoArrowDown } from 'react-icons/io5';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import Link from 'next/link';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { dateFormatter } from '@/utils/formatter';

interface Props {
	className?: string;
	prev: IArticleDetail | null;
	next: IArticleDetail | null;
}

function PrevNextArticle({ className, prev, next }: Props) {
	const [activeArticle, setActiveArticle] = useState<string | null>(null);

	const handleMouseEnter = (type: 'prev' | 'next') => () => setActiveArticle(type);
	const handleMouseLeave = () => setActiveArticle(null);

	const renderArticle = (article: IArticleDetail | null, type: 'prev' | 'next') => {
		const isPrev = type === 'prev';
		const isDisabled = !article;
		const href = isDisabled ? '#' : `/articles/detail/${article?.id}`;
		const text = isPrev ? '이전글' : '다음글';
		// 이전글이 위 줄, 다음글이 아래 줄이라 화살표도 위 · 아래로
		const icon = isPrev ? <IoArrowUp /> : <IoArrowDown />;
		const isActive = activeArticle === type;

		const title = article ? article.title : isPrev ? '이전글이 없습니다.' : '다음글이 없습니다.';
		const date = article ? dateFormatter(article.createdAt) : '';
		const src = article?.imageUrl;

		if (!isDisabled) {
			return (
				<li className={`prev-next ${type} ${isActive ? 'active' : ''}`}>
					<Link
						href={href}
						className="link"
						onMouseEnter={handleMouseEnter(type)}
						onMouseLeave={handleMouseLeave}
					>
						<span className="tag">
							{text}
							{icon}
						</span>
						<div className="img">
							<HeightAutoImg src={src} aspectratio={16 / 9} />
						</div>
						<div className="text-section">
							<p className="title">{title}</p>
							<p className="date">{date}</p>
						</div>
					</Link>
				</li>
			);
		}

		return (
			<li className={`prev-next ${type} disabled`}>
				<div className="link">
					<span className="tag">
						{text}
						{icon}
					</span>
					<div className="text-section">
						<p className="title">{title}</p>
						<p className="date">{date}</p>
					</div>
				</div>
			</li>
		);
	};

	return (
		<PrevNextArticleStyled className={className}>
			<ul>
				{renderArticle(prev, 'prev')} {/* 이전글 */}
				{renderArticle(next, 'next')} {/* 다음글 */}
			</ul>
		</PrevNextArticleStyled>
	);
}

const PrevNextArticleStyled = styled.section`
	border-top: 1px solid ${({ theme }) => theme.color.border};

	/* 두 줄 높이를 늘 같게: 글이 없는 줄도 글이 있는 줄만큼 */
	ul {
		display: grid;
		grid-auto-rows: 1fr;

		li.prev-next {
			display: flex;
			flex-direction: row;
			gap: 1.5rem;
			align-items: center;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			padding: 2.5rem 0;

			.link {
				display: contents;

				/* 이전글 ↑ · 다음글 ↓: 테두리 없는 글자 꼬리표 */
				.tag {
					display: inline-flex;
					align-items: center;
					gap: 0.25rem;
					flex-shrink: 0;
					width: 4.5rem;
					font-size: ${({ theme }) => theme.fontSize.small};
					font-weight: ${({ theme }) => theme.fontWeight.semiBold};
					color: ${({ theme }) => theme.color.subText};
				}

				/* 사진: 가로형(16:9) 작은 칸 */
				.img {
					flex-shrink: 0;
					width: 9rem;
					margin: 0;
					overflow: hidden;
					border-radius: ${({ theme }) => theme.radius.surface};

				}

				.text-section {
					flex: 1;
					min-width: 0;

					.title {
						color: ${({ theme }) => theme.color.mediumGrey};
						font-size: ${({ theme }) => theme.fontSize.medium};
						font-weight: ${({ theme }) => theme.fontWeight.medium};
						margin-bottom: 0.5rem;

						overflow: hidden;
						text-overflow: ellipsis;
						display: -webkit-box;
						-webkit-line-clamp: 1;
						-webkit-box-orient: vertical;
					}

					.date {
						color: ${({ theme }) => theme.color.lightGrey};
						font-size: ${({ theme }) => theme.fontSize.extraSmall};
					}
				}
			}

			&.active {
				background-color: ${({ theme }) => theme.color.surface};
			}

			/* 글이 없을 때: 버튼만 흐리게, 안내 문구는 읽을 수 있는 대비로 (#16) */
			&.disabled {
				pointer-events: none;

				/* 안내 문구는 남은 자리 가운데에 */
				.text-section {
					align-self: stretch;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.title {
					margin: 0;
					color: ${({ theme }) => theme.color.lightGrey};
				}

				.date {
					display: none;
				}
			}
		}
	}

	@media screen and ${({ theme }) => theme.mediaQuery.tablet} {
		ul {

			li.prev-next {
				padding: 1.5rem 0;
				gap: 1rem;

				.img {
					display: none;
				}
			}
		}
	}
`;

export default PrevNextArticle;
