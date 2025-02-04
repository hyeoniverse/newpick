import { forwardRef } from 'react';
import { Card as ICard } from '@/models/card.model';
import styled, { css } from 'styled-components';
import Title from './Title';
import Text from '@/components/common/Text';
import Imgae from '@/components/common/Image';
import Link from 'next/link';
import { DEFAULT_IMAGES } from '@/constants/images';

interface Props {
	className?: string;
	type?: 'main' | 'sub' | 'list';
	data: ICard;
	newTab?: boolean;
}

const Card = forwardRef<HTMLDivElement, Props>(({ type = 'sub', className, data, newTab = false }, ref) => {
	const { image, header, main, footer, url } = data;

	return (
		<StyledCard ref={ref} className={className} $type={type}>
			<div className="card-body">
				{type === 'main' && (
					<>
						<Link href={url || ''} target={newTab ? '_blank' : '_self'}>
							<div className="card-header">
								<Text size="medium" color="primary" weight="semiBold">
									{header}
								</Text>
								{main.title && (
									<Title className="title" weight="semiBold">
										{main.title}
									</Title>
								)}
							</div>
							<div className="card-main">
								<div className="content">
									{main.description && (
										<Text className="description" size="medium">
											{main.description}
										</Text>
									)}
									{footer && (
										<div className="card-footer" onClick={(e) => e.preventDefault()}>
											{footer}
										</div>
									)}
								</div>
								<div className="image-placeholder">
									<Imgae src={image || '/img/newpick_default_img.jpg'} alt={main.title || 'card'} />
								</div>
							</div>
						</Link>
					</>
				)}

				{type === 'sub' && (
					<>
						<Link href={url || '/not-found'}>
							{image && (
								<div className="image-placeholder">
									<Imgae src={image} alt={main.title || 'card'} />
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
						<Link href={url || '/not-found'} passHref legacyBehavior>
							<a target={newTab ? '_blank' : '_self'} rel={newTab ? 'noopener noreferrer' : undefined}>
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
													{main.title}
												</Text>
											)}
											{main.description && (
												<Text className="description" size="small">
													{main.description}
												</Text>
											)}
											{footer && (
												<div className="card-footer" onClick={(e) => e.preventDefault()}>
													{footer}
												</div>
											)}
										</div>

										<div className="image-placeholder">
											<Imgae src={image || `${DEFAULT_IMAGES.MONO}`} alt={main.title || 'card'} />
										</div>
									</div>
								</div>
							</a>
						</Link>
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
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		background: ${({ theme }) => theme.color.surface};
	}

	.card-body {
		width: 100%;
		display: flex;
		flex-direction: column;

		&:hover:not(:has(.card-footer:hover)) {
			img {
				transform: scale(1.05);
				transition: transform 0.3s ease;
			}

			.title {
				color: ${({ theme }) => theme.color.primary};
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
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.card-main {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 1rem;

		.content {
			display: flex;
			flex-direction: column;
			justify-content: space-between;

			.description {
				height: 100%;
				min-height: calc(${({ theme }) => theme.fontSize.medium} * 1.5 * 5);
				line-height: 1.5;
				-webkit-line-clamp: 5;
			}
		}

		.image-placeholder {
			height: 100%;
			min-width: 30%;
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
		align-items: center;

		.content {
			width: 100%;
			display: flex;
			flex-direction: row;
			gap: 1rem;

			.left {
				max-width: 70%;
				display: flex;
				flex-direction: column;
				justify-content: center;
				gap: 0.25rem;
			}

			.image-placeholder {
				height: fit-content;
				max-width: 30%;

				@media ${({ theme }) => theme.mediaQuery.tablet} {
					max-width: 100%;
				}
			}
		}

		.description {
			line-height: 1.5;
			height: calc(${({ theme }) => theme.fontSize.small} * 1.5 * 3);
			-webkit-line-clamp: 3;
		}
	}
`;

export default Card;
