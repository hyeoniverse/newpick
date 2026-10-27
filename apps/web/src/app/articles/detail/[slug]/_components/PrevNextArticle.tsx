'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';
import { mapIdToTitle } from '@/utils/mapInterests';
import Image from '@/components/common/Image';

interface Props {
	className?: string;
	prev: IArticleDetail | null;
	next: IArticleDetail | null;
}

const COPY = {
	prev: { label: '이전 뉴스레터', empty: '첫 뉴스레터예요' },
	next: { label: '다음 뉴스레터', empty: '가장 최근 뉴스레터예요' },
} as const;

/**
 * 이전 · 다음 뉴스레터. PC는 좌우 두 칸, 모바일은 위아래. 칸 전체가 링크이고,
 * 없는 쪽은 점선 칸에 안내만 둔다(눌리지 않음)
 */
function PrevNextArticle({ className, prev, next }: Props) {
	const renderCard = (article: IArticleDetail | null, type: 'prev' | 'next') => {
		const { label, empty } = COPY[type];
		const arrow = type === 'prev' ? <IoArrowBack aria-hidden /> : <IoArrowForward aria-hidden />;

		if (!article) {
			return (
				<li className={`card ${type} empty`}>
					<span className="label">
						{type === 'prev' && arrow}
						{label}
						{type === 'next' && arrow}
					</span>
					<p className="empty-text">{empty}</p>
				</li>
			);
		}

		const image = article.imageUrl ? getFirstImage(article.imageUrl) : '';
		return (
			<li className={`card ${type}`}>
				<Link href={`/articles/detail/${article.id}`} className="link" aria-label={`${label}: ${article.title}`}>
					<div className="text">
						<span className="label">
							{type === 'prev' && arrow}
							{label}
							{type === 'next' && arrow}
						</span>
						<span className="category">{mapIdToTitle([article.categoryId])[0]}</span>
						<p className="title">{article.title}</p>
						<p className="date">{dateFormatter(article.createdAt)}</p>
					</div>
					{image && (
						<div className="thumb">
							<Image src={image} alt="" ratio="square" priority={false} />
						</div>
					)}
				</Link>
			</li>
		);
	};

	return (
		<PrevNextArticleStyled className={className} aria-label="이전 · 다음 뉴스레터">
			<ul>
				{renderCard(prev, 'prev')}
				{renderCard(next, 'next')}
			</ul>
		</PrevNextArticleStyled>
	);
}

const PrevNextArticleStyled = styled.nav`
	padding: 2.5rem 0;
	border-top: 1px solid ${({ theme }) => theme.color.border};

	ul {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin: 0;
		padding: 0;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
		}
	}

	.card {
		min-width: 0;

		/* sanitize.css가 nav 안 li 앞에 넣는 빈 글자(한 줄 높이)를 없앤다 */
		&::before {
			content: none;
		}

		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		transition: border-color 0.2s ease, background-color 0.2s ease;

		&:not(.empty):hover {
			border-color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.tertiary};

			.title {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.link {
		display: flex;
		align-items: center;
		gap: 1rem;
		height: 100%;
		padding: 1.25rem;
		border-radius: inherit;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	/* PC: 다음은 오른쪽 정렬, 사진은 바깥쪽(이전=오른쪽 끝, 다음=왼쪽 끝). 위아래로 쌓이는 모바일은 둘 다 왼쪽 정렬 */
	@media not all and ${({ theme }) => theme.mediaQuery.tablet} {
		.next .link {
			flex-direction: row-reverse;
			text-align: right;
		}

		.next .text,
		.empty.next {
			align-items: flex-end;
		}
	}

	.label {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		margin-bottom: 0.25rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};
	}

	.category {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
	}

	.title {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		line-height: 1.45;
		word-break: keep-all;
		color: ${({ theme }) => theme.color.text};
		transition: color 0.2s ease;
	}

	.date {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.subText};
	}

	.thumb {
		flex-shrink: 0;
		width: 4.5rem;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
	}

	/* 없는 쪽: 점선 칸에 안내만 */
	.empty {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.25rem;
		padding: 1.25rem;
		border-style: dashed;

		.empty-text {
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
		}
	}
`;

export default PrevNextArticle;
