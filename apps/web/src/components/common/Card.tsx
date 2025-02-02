import { forwardRef } from 'react';
import { Card as ICard } from '@/models/card.model';
import styled, { css } from 'styled-components';
import Title from './Title';
import Text from '@/components/common/Text';
import Imgae from '@/components/common/Image';
import Link from 'next/link';

interface Props {
	className?: string;
	type?: 'main' | 'sub' | 'list';
	data: ICard;
}

const Card = forwardRef<HTMLDivElement, Props>(({ type = 'sub', className, data }, ref) => {
	const { image, header, main, footer, url } = data;

	return (
		<StyledCard ref={ref} className={className} $type={type}>
			<div className="card-body">
				{type === 'main' && (
					<>
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
								{footer && <div className="card-footer">{footer}</div>}
							</div>
							{image && (
								<div className="image-placeholder">
									<Imgae src={image} alt={main.title || 'card'} />
								</div>
							)}
						</div>
					</>
				)}

				{type === 'sub' && (
					<>
						{url && (
							<Link href={url}>
								{image && (
									<div className="image-placeholder">
										<Imgae src={image} alt={main.title || 'card'} />
									</div>
								)}
							</Link>
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
						{footer && <div className="card-footer">{footer}</div>}
					</>
				)}

				{type === 'list' && (
					<>
						<div className="card-main">
							<div className="card-header">
								{header && (
									<Text size="small" color="primary" weight="semiBold">
										{header}
									</Text>
								)}
							</div>
							<div className="content">
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
								{footer && <div className="card-footer">{footer}</div>}
							</div>
						</div>
						{image && (
							<div className="image-placeholder">
								<Imgae src={image} alt={main.title || 'card'} />
							</div>
						)}
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
		overflow: hidden;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		background: ${({ theme }) => theme.color.surface};
	}

	.card-body {
		width: 100%;
		display: flex;
		flex-direction: column;

		&:hover img {
			transform: scale(1.05);
			transition: transform 0.3s ease;
		}

		.card-header {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;

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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: ${({ theme }) => theme.color.subText};

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
	.image-placeholder {
		width: 40%;
	}

	.card-body {
		gap: 1rem;
	}

	.card-main {
		flex-direction: row;
		gap: 1rem;

		.content {
			width: 50%;
		}

		.description {
			line-height: 1.5;
			height: calc(${({ theme }) => theme.fontSize.medium} * 1.5 * 7);
			-webkit-line-clamp: 7;
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
	.image-placeholder {
		height: 100%;
		max-width: 30%;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			max-width: 100%;
		}
	}

	.card-body {
		flex-wrap: wrap;
		flex-direction: row;
		padding: 1.5rem 0;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		gap: 1rem;
	}

	.card-main {
		max-width: calc(70% - 1rem);
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;

		.content {
			gap: 0.25rem;
		}

		.description {
			line-height: 1.5;
			height: calc(${({ theme }) => theme.fontSize.small} * 1.5 * 3);
			-webkit-line-clamp: 3;
		}
	}
`;

export default Card;
