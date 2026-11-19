import Link from 'next/link';
import { forwardRef, useRef } from 'react';
import { DEFAULT_IMAGES } from '@/constants/images';
import { Card as ICard } from '@/types/card';

import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Image from '@/components/common/Image';
import Tags from '@/components/common/Tags';
import ExternalLink from '@/components/common/ExternalLink';
import Highlight from '@/components/common/Highlight';
import { useNearViewport } from '@/hooks/useNearViewport';

/**
 * 카드 사진이 화면에서 보이는 폭 (img sizes, styles/card.css). 휴대폰 767px · 태블릿 1023px 기준.
 * 예전에는 주지 않아 고정 크기(400×300)의 2배 사진을 받았다: 휴대폰 목록 64px 썸네일도 828px짜리 (#292)
 */
const SIZES = {
	/** 큰 배너: 태블릿 이하 화면 폭, 그 위 약 527px */
	main: '(max-width: 1023px) 100vw, 540px',
	/** 트렌드 카드: 휴대폰 화면 폭, 그 위 칸 폭 약 320px */
	sub: '(max-width: 767px) 100vw, 320px',
	/** 목록 카드(넓은 화면): 휴대폰 7.5rem, 그 위 최대 15rem */
	listWide: '(max-width: 767px) 120px, 240px',
	/** 목록 카드(휴대폰 썸네일): 4rem */
	listNarrow: '64px',
} as const;

/**
 * 사진 자리 (.image-placeholder, 비율이 정해져 있어 사진을 늦게 넣어도 화면이 밀리지 않는다).
 * defer면 화면에서 300px 안에 들어왔을 때 사진을 넣고, 그전에는 옅은 바탕만 (useNearViewport)
 */
function DeferredImage({ defer = false, children }: { defer?: boolean; children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	const near = useNearViewport(ref, { enabled: defer });
	return (
		<div ref={ref} className="image-placeholder">
			{near ? children : <span className="np-image np-ratio-wide rounded-[8px] bg-surface" aria-hidden />}
		</div>
	);
}

interface Props {
	className?: string;
	type?: 'main' | 'sub' | 'list';
	data: ICard;
	newTab?: boolean;
	/** 검색 결과 목록: 제목 · 설명에서 이 검색어를 강조 (#20) */
	highlight?: string;
	/** 첫 화면에 보이는 카드면 사진을 먼저 받는다 (#292) */
	priority?: boolean;
	/** 첫 화면 아래 카드: 화면 가까이(300px) 올 때 사진을 넣는다 (sub 카드). 첫 화면을 그리는 동안 큰 사진을 받지 않게 (#292) */
	deferImage?: boolean;
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

const Card = forwardRef<HTMLDivElement, Props>(
	({ type = 'sub', className, data, newTab = false, highlight, priority, deferImage }, ref) => {
		const { image, fallbackImage, header, main, footer, url, date, action } = data;

		return (
			<div ref={ref} className={`np-card ${className ?? ''}`} data-type={type}>
				<div className="card-body">
					{type === 'main' && (
						<>
							{/* 톱 기사 형식: 위는 사진 | 분야 · 제목 · 부제, 아래는 카드 전체 폭으로 이 뉴스레터의 소식 · 태그 · 날짜 (모바일은 모두 한 줄씩) */}
							<CardLink href={url || ''} newTab={newTab}>
								<div className="image-placeholder">
									<Image
										src={image || DEFAULT_IMAGES.MONO}
										fallback={fallbackImage}
										alt={main.title || 'card'}
										priority={priority}
										sizes={SIZES.main}
									/>
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
									<DeferredImage defer={deferImage}>
										<Image
											src={image}
											fallback={fallbackImage}
											alt={main.title || 'card'}
											priority={priority}
											sizes={SIZES.sub}
										/>
									</DeferredImage>
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
											<Image
												src={image || DEFAULT_IMAGES.MONO}
												fallback={fallbackImage}
												alt={main.title || 'card'}
												priority={priority}
												sizes={SIZES.listWide}
											/>
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
										<Image
											src={image || DEFAULT_IMAGES.MONO}
											fallback={fallbackImage}
											alt={main.title || 'card'}
											priority={priority}
											sizes={SIZES.listNarrow}
										/>
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
	},
);

Card.displayName = 'Card';

export default Card;
