import Link from 'next/link';
import { forwardRef } from 'react';
import { DEFAULT_IMAGES } from '@/constants/images';
import { Card as ICard } from '@/models/card.model';

import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Image from '@/components/common/Image';
import Tags from '@/components/common/Tags';
import ExternalLink from '@/components/common/ExternalLink';
import Highlight from '@/components/common/Highlight';

interface Props {
	className?: string;
	type?: 'main' | 'sub' | 'list';
	data: ICard;
	newTab?: boolean;
	/** 검색 결과 목록: 제목 · 설명에서 이 검색어를 강조 (#20) */
	highlight?: string;
}

/** 새 탭이면 사이트 밖 링크(관련 뉴스의 언론사 기사)라 ExternalLink, 아니면 사이트 안 이동 */
function CardLink({
	href,
	newTab,
	children,
	className,
}: {
	href: string;
	newTab: boolean;
	children: React.ReactNode;
	className?: string;
}) {
	return newTab ? (
		<ExternalLink href={href} showIcon={false} className={className}>
			{children}
		</ExternalLink>
	) : (
		<Link href={href} className={className}>
			{children}
		</Link>
	);
}

const Card = forwardRef<HTMLDivElement, Props>(({ type = 'sub', className, data, newTab = false, highlight }, ref) => {
	const { image, header, main, footer, url, date, action } = data;

	return (
		<div ref={ref} className={`np-card ${className ?? ''}`} data-type={type}>
			<div className="card-body">
				{type === 'main' && (
					<>
						{/* 톱 기사 형식: 위는 사진 | 분야 · 제목 · 부제, 아래는 카드 전체 폭으로 이 뉴스레터의 소식 · 태그 · 날짜 (모바일은 모두 한 줄씩) */}
						<CardLink href={url || ''} newTab={newTab}>
							<div className="image-placeholder">
								<Image src={image || '/img/newpick_default_img.jpg'} alt={main.title || 'card'} />
							</div>
							<div className="card-main">
								<Text className="category" size="small" color="primary" weight="semiBold">
									{header}
								</Text>
								{main.title && (
									<Title as="h3" className="title" weight="bold">
										{main.title}
									</Title>
								)}
								{main.description && (
									<Text className="description" size="medium">
										{main.description}
									</Text>
								)}
								{!!main.points?.length && (
									<div className="points">
										<p className="points-title">이 뉴스레터의 소식</p>
										<ol>
											{main.points.map((point, i) => (
												<li key={point.heading}>
													<span className="no">{String(i + 1).padStart(2, '0')}</span>
													<span className="heading">{point.heading}</span>
												</li>
											))}
										</ol>
									</div>
								)}
								<Tags tags={main.tags} max={4} className="tags" />
								{footer && (
									<div className="card-footer" onClick={(e) => e.preventDefault()}>
										{footer}
									</div>
								)}
							</div>
						</CardLink>
					</>
				)}

				{type === 'sub' && (
					<>
						<Link href={url || '/not-found'}>
							{image && (
								<div className="image-placeholder">
									<Image src={image} alt={main.title || 'card'} />
								</div>
							)}
							<div className="card-header">
								{header && (
									<Text size="small" color="primary" weight="semiBold">
										{header}
									</Text>
								)}
							</div>
							<div className="card-main">
								<div className="content">
									{main.title && (
										<Text className="title" size="large" weight="semiBold">
											{main.title}
										</Text>
									)}
									{main.description && (
										<Text className="description" size="small">
											{main.description}
										</Text>
									)}
								</div>
							</div>
						</Link>
						{footer && <div className="card-footer">{footer}</div>}
					</>
				)}

				{type === 'list' && (
					<>
						{/* 제목 링크를 카드 전체로 늘려(::after) 어디를 눌러도 상세로. 태그 · 북마크는 그 위에 따로 눌린다 (#20) */}
						<div className="card-stretch wide">
							<div className="card-main">
								<div className="card-header">
									{header && (
										<Text size="small" color="primary" weight="semiBold">
											{header}
										</Text>
									)}
								</div>
								<div className="content">
									<div className="left">
										{main.title && (
											<CardLink href={url || '/not-found'} newTab={newTab} className="stretched-link">
												<Text className="title" size="medium" weight="semiBold">
													<Highlight text={main.title} query={highlight} />
												</Text>
											</CardLink>
										)}
										{main.description && (
											<Text className="description" size="small">
												<Highlight text={main.description} query={highlight} />
											</Text>
										)}
										<Tags tags={main.tags} max={4} className="tags" linkable />
										{footer && <div className="card-footer">{footer}</div>}
									</div>

									<div className="image-placeholder">
										<Image src={image || `${DEFAULT_IMAGES.MONO}`} alt={main.title || 'card'} />
									</div>
								</div>
							</div>
						</div>
						{/* 휴대폰 카드: 분야 · 날짜 / 제목 · 설명 | 작은 썸네일 / 태그 · 북마크 */}
						<div className="card-stretch narrow">
							<div className="top">
								{header && <span className="category">{header}</span>}
								{date && <span className="date">{date}</span>}
							</div>
							<div className="row">
								<div className="text">
									{main.title && (
										<CardLink href={url || '/not-found'} newTab={newTab} className="stretched-link">
											<Text className="title" size="medium" weight="semiBold">
												<Highlight text={main.title} query={highlight} />
											</Text>
										</CardLink>
									)}
									{main.description && (
										<Text className="description" size="small">
											<Highlight text={main.description} query={highlight} />
										</Text>
									)}
								</div>
								<div className="image-placeholder">
									<Image src={image || `${DEFAULT_IMAGES.MONO}`} alt={main.title || 'card'} />
								</div>
							</div>
							{(!!main.tags?.length || action) && (
								<div className="bottom">
									<Tags tags={main.tags} max={2} className="tags" linkable />
									{action && <div className="action">{action}</div>}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
});

Card.displayName = 'Card';

export default Card;
