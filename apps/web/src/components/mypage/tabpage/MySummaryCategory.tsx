import Link from 'next/link';
import { currentUserData } from '@/mocks/mypage/currentUser';

import styled from 'styled-components';
import { IoIosArrowForward } from 'react-icons/io';
import Image from '@/components/common/Image';
import LikeIcon from '@/components/common/icons/LikeIcon';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import OrigLinkIcon from '@/components/common/icons/OrigLinkIcon';

function MySummaryCategory() {
	const { summaries } = currentUserData;

	return (
		<>
			<MySummaryCategoryStyled>
				{summaries.map((news, index) => (
					<div key={index} className="content" id={news.categoryName}>
						<div className="top">
							<Link href="/mypage" className="category-name">
								{news.categoryName}
								<IoIosArrowForward />
							</Link>
							<div className="title-section">
								<h3 className="title-text">{news.title}</h3>
							</div>
						</div>

						<div className="bottom">
							<div className="image-section">
								<div className="image-placeholder">
									<Image src={news.img} alt={news.title} />
								</div>
								<div className="etc">
									<LikeIcon />
									<LinkCopyIcon />
									<OrigLinkIcon />
								</div>
							</div>
							<p className="text">{news.summary}</p>
						</div>
					</div>
				))}
			</MySummaryCategoryStyled>
		</>
	);
}

const MySummaryCategoryStyled = styled.div`
	@keyframes moveForward {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(0.375rem);
		}
	}

	.image-placeholder {
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		background: ${({ theme }) => theme.color.surface};
	}

	.content {
		height: 100%;
		max-width: 100%;
		margin-top: 3.75rem;
		scroll-margin-top: 7.4rem;

		.top {
			margin-top: 3.75rem;
			margin-bottom: 1.875rem;

			.category-name {
				font-size: ${({ theme }) => theme.fontSize.medium};
				font-weight: ${({ theme }) => theme.fontWeight.medium};
				margin-bottom: 1.25rem;
				color: ${({ theme }) => theme.color.primary};

				&:hover {
					svg {
						animation: moveForward 0.7s linear infinite;
					}
				}
			}

			.title-section {
				display: flex;
				flex-direction: row;
				gap: 0.5rem;

				.title-text {
					font-size: ${({ theme }) => theme.fontSize.large};
					flex: 1;
				}
			}
		}

		.bottom {
			height: 100%;
			display: flex;
			flex-direction: row;
			gap: 1.25rem;

			.text {
				flex: 2;
				height: 100%;
				background-color: ${({ theme }) => theme.color.surface};
				border: 1px solid ${({ theme }) => theme.color.border};
				border-radius: ${({ theme }) => theme.borderRadius.medium};
				padding: 1.25rem;
				color: ${({ theme }) => theme.color.subText};
			}

			.image-section {
				flex: 1;

				.etc {
					display: flex;
					flex-direction: row;
					justify-content: center;
					gap: 1rem;
					margin-top: 1rem;
				}
			}

			@media (max-width: 768px) {
				flex-direction: column;

				.text,
				.image-section {
					flex: none; /* flex 비율 대신 각자 100% 너비 (혹은 auto) */
					width: 100%;
				}
			}
		}
	}
`;

export default MySummaryCategory;
