'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { IoArrowUp, IoArrowDown } from 'react-icons/io5';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { DEFAULT_IMAGES } from '@/constants/images';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';
import { mapIdToTitle } from '@/utils/mapInterests';
import Image from '@/components/common/Image';

interface Props {
	className?: string;
	prev: IArticleDetail | null;
	next: IArticleDetail | null;
}

const ROWS = {
	prev: { label: '이전', name: '이전 뉴스레터', icon: <IoArrowUp aria-hidden />, empty: '첫 뉴스레터예요' },
	next: { label: '다음', name: '다음 뉴스레터', icon: <IoArrowDown aria-hidden />, empty: '가장 최근 뉴스레터예요' },
} as const;

/**
 * 이전 · 다음 뉴스레터. 신문 목록처럼 얇은 선 사이 두 줄: 꼬리표 · 사진 · 관심사와 제목 · 날짜.
 * 줄 전체가 링크이고, 없는 쪽은 흐린 글씨로 안내만
 */
function PrevNextArticle({ className, prev, next }: Props) {
	const renderRow = (article: IArticleDetail | null, type: 'prev' | 'next') => {
		const { label, name, icon, empty } = ROWS[type];
		const tag = (
			<span className="tag">
				{label}
				{icon}
			</span>
		);

		if (!article) {
			return (
				<li className="row empty">
					{tag}
					<span className="title">{empty}</span>
				</li>
			);
		}

		const image = (article.imageUrl && getFirstImage(article.imageUrl)) || DEFAULT_IMAGES.MONO;
		return (
			<li className="row">
				<Link href={`/articles/detail/${article.id}`} className="link" aria-label={`${name}: ${article.title}`}>
					{tag}
					<span className="photo">
						<Image src={image} alt="" ratio="wide" priority={false} />
					</span>
					<span className="text">
						<span className="category">{mapIdToTitle([article.categoryId])[0]}</span>
						<span className="title">{article.title}</span>
					</span>
					<span className="date">{dateFormatter(article.createdAt)}</span>
				</Link>
			</li>
		);
	};

	return (
		<PrevNextArticleStyled className={className} aria-label="이전 · 다음 뉴스레터">
			<ul>
				{renderRow(prev, 'prev')}
				{renderRow(next, 'next')}
			</ul>
		</PrevNextArticleStyled>
	);
}

const PrevNextArticleStyled = styled.nav`
	margin: 2.5rem 0;

	ul {
		margin: 0;
		padding: 0;
		border-top: 1px solid ${({ theme }) => theme.color.text};
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
	}

	.row {
		/* sanitize.css가 nav 안 li 앞에 넣는 빈 글자(한 줄 높이)를 없앤다 */
		&::before {
			content: none;
		}

		& + .row {
			border-top: 1px solid ${({ theme }) => theme.color.border};
		}
	}

	.link,
	.empty {
		display: grid;
		grid-template-columns: 4.5rem 8rem 1fr auto;
		align-items: center;
		gap: 1.25rem;
		padding: 1rem 0.25rem;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 3.25rem 5.5rem 1fr;
			gap: 0.75rem;
		}
	}

	/* 없는 쪽은 사진 자리 없이 꼬리표 옆에 바로 안내 */
	.empty {
		grid-template-columns: 4.5rem 1fr;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 3.25rem 1fr;
		}
	}

	.photo {
		display: block;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};

		img {
			transition: transform 0.4s ease;
		}
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.category {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};

		svg {
			width: 0.875rem;
			height: 0.875rem;
		}
	}

	.title {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		min-width: 0;
		overflow: hidden;
		line-height: 1.45;
		word-break: keep-all;
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		color: ${({ theme }) => theme.color.text};
		transition: color 0.2s ease;
	}

	.date {
		font-size: ${({ theme }) => theme.fontSize.small};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.subText};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			display: none;
		}
	}

	.link:hover {
		.title {
			color: ${({ theme }) => theme.color.primary};
		}

		.photo img {
			transform: scale(1.05);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.photo img {
			transition: none;
		}

		.link:hover .photo img {
			transform: none;
		}
	}

	.empty .title {
		font-weight: ${({ theme }) => theme.fontWeight.regular};
		color: ${({ theme }) => theme.color.subText};
	}
`;

export default PrevNextArticle;
