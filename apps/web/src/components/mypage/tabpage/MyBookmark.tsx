import Link from 'next/link';
import { currentUserData } from '@/mocks/mypage/currentUser';

import styled from 'styled-components';
import Image from '@/components/common/Image';
import LikeIcon from '@/components/common/icons/LikeIcon';
import NoContentsPage from '@/components/mypage/common(temporary)/NoContentsPage';

function MyBookmark() {
	const { bookmarks, summaries } = currentUserData;

	return (
		<>
			{bookmarks.length > 0 ? (
				<>
					<MyBookmarkStyled>
						{summaries.map((news, index) => (
							<div key={index} className="card">
								<Link href={`#`}>
									<Image src={news.img} alt={news.title} />
								</Link>
								<div className="content">
									<Link href={`#`} className="category">
										{news.categoryName}
									</Link>
									<Link href={`#`} className="title">
										{news.title}
									</Link>
									<p className="subText">{news.summary}</p>
									<div className="etc">
										<div className="date">{news.createdAt}</div>
										{/*<div className="bar"/>*/}
										<LikeIcon />
									</div>
								</div>
							</div>
						))}
					</MyBookmarkStyled>
				</>
			) : (
				<NoContentsPage
					text={`북마크한 뉴스레터가 없습니다. \n 다른 뉴스레터를 찾아보세요.`}
					btnText={'오늘의 뉴스레터'}
					moveTo={'/'}
				/>
			)}
		</>
	);
}

const MyBookmarkStyled = styled.div`
	display: grid;
	justify-items: start;
	justify-content: start;
	gap: 2rem;
	grid-template-columns: repeat(3, 1fr);

	.card {
		width: auto;

		.content {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;

			.category {
				color: ${({ theme }) => theme.color.primary};
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				font-weight: ${({ theme }) => theme.fontWeight.medium};
				width: max-content;
			}

			.title,
			.subText {
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
				word-break: keep-all;
			}

			.title {
				font-size: ${({ theme }) => theme.fontSize.large};
				line-height: 1.2;
				margin: 0;
			}

			.subText {
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.subText};
			}

			.etc {
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: space-between;

				.bar {
					border-left: 1px solid ${({ theme }) => theme.color.border};
					margin: 0 1.25rem;
					height: 1.5rem;
				}

				.date {
					font-size: ${({ theme }) => theme.fontSize.extraSmall};
					color: ${({ theme }) => theme.color.neutral};
				}
			}
		}
	}

	@media (${({ theme }) => theme.mediaQuery.tablet}) {
		grid-template-columns: repeat(2, 1fr);
	}
	@media (${({ theme }) => theme.mediaQuery.mobile}) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

export default MyBookmark;
