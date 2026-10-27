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
function CardLink({ href, newTab, children }: { href: string; newTab: boolean; children: React.ReactNode }) {
	return newTab ? (
		<ExternalLink href={href} showIcon={false}>
			{children}
		</ExternalLink>
	) : (
		<Link href={href}>{children}</Link>
	);
}

const Card = forwardRef<HTMLDivElement, Props>(({ type = 'sub', className, data, newTab = false, highlight }, ref) => {
	const { image, header, main, footer, url } = data;

	return (
		<StyledCard ref={ref} className={className} $type={type}>
			<div className="card-body">
				{type === 'main' && (
					<>
						{/* 톱 기사 형식: 사진 | 분야 · 제목 · 부제 · 키워드 · 날짜 (모바일은 사진이 위) */}
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
						<CardLink href={url || '/not-found'} newTab={newTab}>
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
											<Text className="title" size="medium" weight="semiBold">
												<Highlight text={main.title} query={highlight} />
											</Text>
										)}
										{main.description && (
											<Text className="description" size="small">
												<Highlight text={main.description} query={highlight} />
											</Text>
										)}
										<Tags tags={main.tags} max={4} className="tags" />
										{footer && (
											<div className="card-footer" onClick={(e) => e.preventDefault()}>
												{footer}
											</div>
										)}
									</div>

									<div className="image-placeholder">
										<Image src={image || `${DEFAULT_IMAGES.MONO}`} alt={main.title || 'card'} />
									</div>
								</div>
							</div>
						</CardLink>
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

		&:hover:not(:has(.card-footer:hover)) {
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

	a {
		display: grid;
		grid-template-columns: minmax(0, 11fr) minmax(0, 9fr);
		align-items: center;
		gap: 2rem;
		width: 100%;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}

	.image-placeholder {
		margin: 0;
		aspect-ratio: 16 / 9;
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

		/* 분야 페이지 배너: 이 뉴스레터에 담긴 소식 */
		.points {
			width: 100%;
			margin-top: 0.25rem;

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

		.card-footer {
			margin-top: 0.75rem;
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
