'use client'

import { useState } from 'react';
import styled from 'styled-components';
import MoveButton from '@/components/common/MoveButton';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import Link from 'next/link';
import { IArticleDetail } from '@/models/articleDetail';
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
		const icon = isPrev ? <IoArrowBack /> : <IoArrowForward />;
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
						{isPrev ? (
							<MoveButton className="btn" text={text} frontIcon={icon} />
						) : (
							<MoveButton className="btn" text={text} backIcon={icon} />
						)}

						<div className="img">
							<HeightAutoImg src={src} aspectratio={1} />
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
					{isPrev ? (
						<MoveButton className="btn" text={text} frontIcon={icon} disabled />
					) : (
						<MoveButton className="btn" text={text} backIcon={icon} disabled />
					)}
					<div className="img">
						<HeightAutoImg src={src} aspectratio={1} />
					</div>
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
				{renderArticle(prev, 'prev')}  {/* 이전글 */}
				{renderArticle(next, 'next')}  {/* 다음글 */}
			</ul>
		</PrevNextArticleStyled>
	);
}

const PrevNextArticleStyled = styled.section`
  border-top: 1px solid ${({ theme }) => theme.color.border};

  ul {
    li.prev-next {
      display: flex;
      flex-direction: row;
      gap: 1.5rem;
      align-items: center;
      height: fit-content;
      border-bottom: 1px solid ${({ theme }) => theme.color.border};
      padding: 2.5rem 1rem;

      .link {
        display: contents;

        .btn {
          flex: 0.8;
        }

        .img {
          flex: 1.2;
          margin: 0;
        }

        .text-section {
          flex: 8;

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

      &.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
    }
  }

  @media screen and ${({ theme }) => theme.mediaQuery.tablet} {
    ul {
      display: flex;
      flex-direction: column;

      li.prev-next {
        padding: 1.5rem 1rem;
        gap: 1rem;

        .img {
          display: none;
        }
      }
    }
  }
`;

export default PrevNextArticle;
