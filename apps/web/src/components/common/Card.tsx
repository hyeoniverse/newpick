import Link from 'next/link';
import { forwardRef } from 'react';
import { DEFAULT_IMAGES } from '@/constants/images';
import { Card as ICard } from '@/models/card.model';

import styled, { css } from 'styled-components';
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
	const { image, header, main, footer, url } = data;

	return (
		<StyledCard ref={ref} className={className} $type={type}>
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
						<div className="card-stretch">
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
					</>
				)}
			</div>
		</StyledCard>
	);
});

Card.displayName = 'Card';

interface StyledProps {
	$type: 'main' | 'sub' | 'list';
}

const StyledCard = styled.div<StyledProps>`
	/* 목록 카드: 제목 링크가 카드 전체를 덮고, 태그 · 아래 줄(북마크)은 그 위에서 따로 눌린다 */
	.card-stretch {
		position: relative;
		width: 100%;

		/* 카드 안 링크 공통 모양(가로 정렬 · 폭)이 태그 링크에는 걸리지 않게 */
		.tags a {
			display: inline;
			width: auto;
		}

		.stretched-link::after {
			position: absolute;
			inset: 0;
			z-index: 0;
			content: '';
		}

		/* 키보드로 오면 카드 전체에 포커스 테두리 */
		.stretched-link:focus-visible {
			outline: none;

			&::after {
				outline: 2px solid ${({ theme }) => theme.color.primary};
				outline-offset: 4px;
				border-radius: ${({ theme }) => theme.radius.surface};
			}
		}

		.tags,
		.card-footer {
			position: relative;
			z-index: 1;
		}
	}

	/* 검색어 강조 (#20): 강조색 옅은 배경, 글자는 그대로 */
	mark {
		padding: 0 0.125rem;
		border-radius: 2px;
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};
	}

	width: 100%;
	display: flex;
	flex-direction: column;
	cursor: pointer;
	overflow: hidden;

	.image-placeholder {
		width: 100%;
		aspect-ratio: 16 / 9;
		position: relative;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};
	}

	.card-body {
		width: 100%;
		display: flex;
		flex-direction: column;

		/* 커질 때만이 아니라 마우스를 뗄 때도 같은 속도로 돌아오게 기본 상태에 둔다 (Image의 opacity 전환은 유지) */
		img {
			transition:
				transform 0.4s ease,
				opacity 0.3s ease-in-out;
		}

		@media (prefers-reduced-motion: reduce) {
			img {
				transition: opacity 0.3s ease-in-out;
			}
		}

		&:hover:not(:has(.card-footer:hover, .tags a:hover)) {
			img {
				transform: scale(1.05);
			}

			.title {
				color: ${({ theme }) => theme.color.primary};
				width: 100%;
			}
		}

		.card-header {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			margin-bottom: 0.5rem;

			.rounded-icon-button {
				&:hover {
					button {
						background: ${({ theme }) => theme.color.primary};
					}
				}
			}
		}

		.card-main {
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: flex-start;
		}

		.content {
			display: flex;
			flex-direction: column;
			flex-grow: 1;
		}

		.title {
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-line-clamp: 1;
			-webkit-box-orient: vertical;
		}

		.description {
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
		}
	}

	.card-footer {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: ${({ theme }) => theme.color.subText};
		cursor: default;

		span {
			font-size: ${({ theme }) => theme.fontSize.small};
			/* 좁은 화면(360px)에서 날짜 · 조회수가 '2026-10- / 27'처럼 끊기지 않게 (#17) */
			white-space: nowrap;
		}

		.rounded-icon-button {
			padding: 0.5rem 0.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};

			svg {
				color: ${({ theme }) => theme.color.subText};
				transform: scale(1.5);
			}

			&:hover {
				background: ${({ theme }) => theme.color.tertiary};

				svg {
					color: ${({ theme }) => theme.color.primary};
				}
			}
		}

		.right {
			flex: 1;
			display: flex;
			justify-content: flex-end;
			align-items: center;
			gap: 1rem;
		}
	}

	${({ $type }) => ($type === 'main' ? mainCardStyles : $type === 'sub' ? subCardStyles : listCardStyles)}
`;

const mainCardStyles = css`
	.card-body {
		width: 100%;
	}

	/*
	 * PC · 노트북: 사진 | 분야 · 제목 · 설명 · 소식, 아래 카드 전체 폭으로 태그 · 날짜
	 * 태블릿: 위는 사진 | 분야 · 제목 · 설명, 아래 카드 전체 폭으로 소식 · 태그 · 날짜
	 * 휴대폰: 모두 한 줄씩
	 */
	a {
		display: grid;
		grid-template-columns: minmax(0, 11fr) minmax(0, 9fr);
		/* 사진이 글보다 길면 남는 높이는 소식 칸 아래로 */
		grid-template-rows: auto auto auto 1fr auto auto;
		grid-template-areas:
			'img category'
			'img title'
			'img desc'
			'img points'
			'tags tags'
			'footer footer';
		column-gap: 2rem;
		row-gap: 0.5rem;
		width: 100%;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-rows: 1fr auto auto auto 1fr auto auto auto;
			grid-template-areas:
				'img .'
				'img category'
				'img title'
				'img desc'
				'img .'
				'points points'
				'tags tags'
				'footer footer';
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 1fr;
			grid-template-rows: none;
			/* 휴대폰은 설명을 빼므로 그 줄도 없앤다 (빈 줄의 간격이 남지 않게) */
			grid-template-areas: 'img' 'category' 'title' 'points' 'tags' 'footer';
		}
	}

	/* 사진은 칸 위쪽에 붙인다 (오른쪽 글이 사진보다 길어도 사진이 가운데로 내려가지 않게) */
	.image-placeholder {
		grid-area: img;
		align-self: start;
		margin: 0;
		aspect-ratio: 16 / 9;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			margin-bottom: 0.5rem;
		}
	}

	/* 안쪽 칸들이 바로 위 격자의 칸이 되게 (공통 .card-body .card-main의 flex보다 앞서도록 같은 깊이로) */
	.card-body .card-main {
		display: contents;
	}

	.category {
		grid-area: category;
	}

	.title {
		grid-area: title;
	}

	.description {
		grid-area: desc;
	}

	.points {
		grid-area: points;
	}

	.tags {
		grid-area: tags;
	}

	.card-footer {
		grid-area: footer;
	}

	/* 휴대폰은 짧게: 설명은 빼고(소식 목록이 대신 말해 줌), 글자 · 간격을 줄인다 */
	@media ${({ theme }) => theme.mediaQuery.mobile} {
		a {
			row-gap: 0.375rem;
		}

		/* 아래 .card-main 규칙보다 앞서도록 한 단계 더 구체적으로 */
		.card-body .card-main .description,
		.card-body .card-main .points-title {
			display: none;
		}

		.card-body .card-main .title {
			font-size: ${({ theme }) => theme.fontSize.medium};
		}

		/* 사진도 낮게 (16:9 → 2:1) */
		.image-placeholder {
			aspect-ratio: 2 / 1;
		}

		.card-body .card-main .points {
			margin-top: 0;

			li {
				padding: 0.25rem 0;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
			}
		}

		.card-body .card-main .card-footer {
			margin-top: 0.25rem;
			padding-top: 0.5rem;
		}
	}

	.card-main {
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 0.5rem;
		min-width: 0;

		.title {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraLarge};
			line-height: 1.35;
			word-break: keep-all;
			-webkit-line-clamp: 2;

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				font-size: ${({ theme }) => theme.fontSize.large};
			}
		}

		.description {
			line-height: 1.6;
			color: ${({ theme }) => theme.color.subText};
			-webkit-line-clamp: 3;

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				-webkit-line-clamp: 2;
			}
		}

		/* 분야 페이지 배너: 이 뉴스레터에 담긴 소식 (태블릿 이하는 사진 아래, 카드 전체 폭) */
		.points {
			width: 100%;
			margin-top: 0.25rem;

			@media ${({ theme }) => theme.mediaQuery.tablet} {
				margin-top: 1rem;
			}

			.points-title {
				margin: 0 0 0.375rem;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				color: ${({ theme }) => theme.color.subText};
			}

			ol {
				margin: 0;
				padding: 0;
				list-style: none;
			}

			li {
				display: flex;
				gap: 0.625rem;
				padding: 0.375rem 0;
				border-top: 1px dashed ${({ theme }) => theme.color.border};
				font-size: ${({ theme }) => theme.fontSize.small};
				line-height: 1.5;
				color: ${({ theme }) => theme.color.text};

				&:first-child {
					border-top: none;
				}
			}

			.no {
				flex-shrink: 0;
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				font-variant-numeric: tabular-nums;
				color: ${({ theme }) => theme.color.primary};
			}

			.heading {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.tags {
			margin-top: 0.25rem;

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				li:nth-child(n + 4) {
					display: none;
				}
			}
		}

		/* 카드 전체 폭의 날짜 줄 위에 얇은 구분선 */
		.card-footer {
			margin-top: 0.5rem;
			padding-top: 0.75rem;
			border-top: 1px solid ${({ theme }) => theme.color.border};
			white-space: nowrap;
		}
	}
`;

const subCardStyles = css`
	.image-placeholder {
		width: 100%;
		margin-bottom: 1rem;
	}

	.card-main {
		flex-direction: column;

		.content {
			gap: 0;

			.description {
				line-height: 1.5;
				height: calc(${({ theme }) => theme.fontSize.small} * 1.5 * 2);
			}
		}
	}
`;

const listCardStyles = css`
	/* 목록 마지막 카드는 아래 구분선 없음 */
	&:last-child .card-body {
		border-bottom: none;
	}

	a {
		width: 100%;
		display: flex;
		flex-direction: row;
		padding: 0;
		margin: 0;
		gap: 0.5rem;
	}

	.card-body {
		flex-wrap: wrap;
		flex-direction: row;
		padding: 1.25rem 0.25rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		gap: 1rem;
	}

	.card-main {
		width: 100%;
		flex-direction: column;
		align-items: stretch;

		/* 뉴스 목록 모양: 글은 왼쪽, 썸네일은 오른쪽 고정 폭 (모바일도 같은 줄) */
		.content {
			width: 100%;
			display: flex;
			flex-direction: row;
			align-items: flex-start;
			gap: 1.5rem;

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				gap: 0.75rem;
			}

			.left {
				flex: 1;
				min-width: 0;
				display: flex;
				flex-direction: column;
				gap: 0.25rem;
			}

			.image-placeholder {
				flex: 0 0 15rem;
				width: 15rem;

				@media ${({ theme }) => theme.mediaQuery.mobile} {
					flex-basis: 7.5rem;
					width: 7.5rem;
				}
			}
		}

		.title {
			-webkit-line-clamp: 2;
		}

		.tags {
			margin-top: 0.25rem;

			/* 모바일은 한 줄에 들어가는 2개까지 */
			@media ${({ theme }) => theme.mediaQuery.mobile} {
				li:nth-child(n + 3) {
					display: none;
				}
			}
		}

		.description {
			line-height: 1.5;
			height: calc(${({ theme }) => theme.fontSize.small} * 1.5 * 3);
			-webkit-line-clamp: 3;

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				height: auto;
				-webkit-line-clamp: 2;
			}
		}
	}
`;

export default Card;
