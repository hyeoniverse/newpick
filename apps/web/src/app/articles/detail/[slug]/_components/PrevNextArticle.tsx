'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';
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

const LABELS = { prev: '이전 뉴스레터', next: '다음 뉴스레터' } as const;

/**
 * 이전 · 다음 뉴스레터. 테두리 칸 없이 사진을 크게 깔고 그 아래 관심사 · 제목 · 날짜.
 * 왼쪽이 이전(더 오래된 글), 오른쪽이 다음. 없는 쪽은 비워 둔다
 */
function PrevNextArticle({ className, prev, next }: Props) {
	const renderSide = (article: IArticleDetail | null, type: 'prev' | 'next') => {
		if (!article) return <li className={`side ${type} empty`} aria-hidden />;

		const label = LABELS[type];
		const image = (article.imageUrl && getFirstImage(article.imageUrl)) || DEFAULT_IMAGES.MONO;
		return (
			<li className={`side ${type}`}>
				<Link href={`/articles/detail/${article.id}`} className="link" aria-label={`${label}: ${article.title}`}>
					<span className="label">
						{type === 'prev' && <IoArrowBack aria-hidden />}
						{label}
						{type === 'next' && <IoArrowForward aria-hidden />}
					</span>
					<div className="photo">
						<Image src={image} alt="" ratio="wide" priority={false} />
					</div>
					<span className="category">{mapIdToTitle([article.categoryId])[0]}</span>
					<p className="title">{article.title}</p>
					<p className="date">{dateFormatter(article.createdAt)}</p>
				</Link>
			</li>
		);
	};

	if (!prev && !next) return null;

	return (
		<PrevNextArticleStyled className={className} aria-label="이전 · 다음 뉴스레터">
			<ul>
				{renderSide(prev, 'prev')}
				{renderSide(next, 'next')}
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
		gap: 2rem;
		margin: 0;
		padding: 0;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			gap: 1rem;
		}
	}

	.side {
		min-width: 0;

		/* sanitize.css가 nav 안 li 앞에 넣는 빈 글자(한 줄 높이)를 없앤다 */
		&::before {
			content: none;
		}
	}

	.link {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	/* 다음은 오른쪽 정렬: 화살표 방향과 같은 쪽으로 */
	.next .link {
		align-items: flex-end;
		text-align: right;
	}

	.label {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		margin-bottom: 0.375rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};

		svg {
			transition: transform 0.2s ease;
		}
	}

	.photo {
		width: 100%;
		margin-bottom: 0.5rem;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};

		img {
			transition: transform 0.4s ease;
		}
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

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			font-size: ${({ theme }) => theme.fontSize.small};
		}
	}

	.date {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.subText};
	}

	/* 마우스를 올리면 사진이 살짝 가까워지고 제목 · 화살표가 반응 */
	.link:hover {
		.photo img {
			transform: scale(1.04);
		}

		.title {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.prev .link:hover .label svg {
		transform: translateX(-3px);
	}

	.next .link:hover .label svg {
		transform: translateX(3px);
	}

	@media (prefers-reduced-motion: reduce) {
		.photo img,
		.label svg {
			transition: none;
		}

		.link:hover .photo img,
		.link:hover .label svg {
			transform: none;
		}
	}
`;

export default PrevNextArticle;
