'use client';

import { useState } from 'react';
import { IoArrowUp, IoArrowDown } from 'react-icons/io5';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import Link from 'next/link';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { dateFormatter } from '@/utils/formatter';
import { cx } from '@/styles/tw';

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
					<Link href={href} className="link" onMouseEnter={handleMouseEnter(type)} onMouseLeave={handleMouseLeave}>
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
		<PrevNextArticleStyled className={className} data-track-section="detail-prev-next">
			<ul>
				{renderArticle(prev, 'prev')} {/* 이전글 */}
				{renderArticle(next, 'next')} {/* 다음글 */}
			</ul>
		</PrevNextArticleStyled>
	);
}

const PrevNextArticleStyled = ({ className, ...props }: React.ComponentProps<'section'>) => (
	<section className={cx('np-articles-prev-next-article-prev-next-article', className)} {...props} />
);

export default PrevNextArticle;
