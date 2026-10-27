import { useQuery } from '@tanstack/react-query';
import { NewsInfo as INewsInfo } from '@/models/article.model';
import { dateFormatter } from '@/utils/formatter';
import { getRelatedNews } from '@/hooks/useArticle';
import { DEFAULT_IMAGES } from '@/constants/images';

import { styled } from 'styled-components';
import { FaLink } from 'react-icons/fa';
import ExternalLink from '@/components/common/ExternalLink';
import Image from '@/components/common/Image';

interface Props {
	urls: string[];
}

/**
 * 관련 뉴스: 이 뉴스레터를 만들 때 쓴 언론사 기사. 누르면 새 탭으로 원문.
 * 배경 · 테두리 없이 얇은 선으로 나눈 목록, 사진은 오른쪽
 */
export default function OpenGraphCard({ urls }: Props) {
	// 주소 목록(내용)으로 캐시해, 화면이 다시 그려져도(스크롤 등) 다시 요청하지 않는다.
	// 예전에는 urls 배열이 그릴 때마다 새로 만들어져 useEffect가 매번 다시 요청했고,
	// API 요청 제한(429)에 걸린 요청이 빠지면서 카드가 떴다 사라졌다
	const { data: relatedNewsData = [] } = useQuery<INewsInfo[]>({
		queryKey: ['relatedNews', urls.join(',')],
		queryFn: () => getRelatedNews(urls),
		enabled: urls.length > 0,
		staleTime: 1000 * 60 * 30,
	});

	if (relatedNewsData.length === 0) return null;

	return (
		<StyledRelated>
			<h2 className="heading">
				<FaLink aria-hidden />
				관련 뉴스
			</h2>
			<ul className="list">
				{relatedNewsData.map((news) => (
					<li key={news.link}>
						<ExternalLink href={news.link} showIcon={false} className="item">
							<span className="photo">
								<Image src={news.images[0] || DEFAULT_IMAGES.MONO} alt="" ratio="wide" priority={false} />
							</span>
							<span className="text">
								<span className="meta">
									<span className="source">{news.source}</span>
									<span aria-hidden>·</span>
									<span>{dateFormatter(news.publishedAt)}</span>
								</span>
								<span className="title">{news.title}</span>
								<span className="summary">{news.content}</span>
							</span>
						</ExternalLink>
					</li>
				))}
			</ul>
		</StyledRelated>
	);
}

const StyledRelated = styled.section`
	margin: 2rem 0 4rem;

	.heading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.text};

		svg {
			width: 0.875rem;
			color: ${({ theme }) => theme.color.primary};
		}
	}

	ul {
		margin: 0;
		padding: 0;
	}

	.item {
		display: flex;
		gap: 1.25rem;
		color: inherit;
		text-decoration: none;
	}

	.photo {
		display: block;
		flex-shrink: 0;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};

		img {
			transition: transform 0.4s ease;
		}
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		min-width: 0;
	}

	.meta {
		display: flex;
		gap: 0.375rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		.source {
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.title {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		line-height: 1.45;
		word-break: keep-all;
		color: ${({ theme }) => theme.color.text};
		transition: color 0.2s ease;
	}

	.summary {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.55;
		color: ${({ theme }) => theme.color.subText};
	}

	.item:hover {
		.title {
			color: ${({ theme }) => theme.color.primary};
		}

		.photo img {
			transform: scale(1.04);
		}
	}

	/* 구분선 목록: 배경 · 테두리 없이 얇은 선으로 나누고 사진은 오른쪽 */
	.list {
		border-top: 1px solid ${({ theme }) => theme.color.text};

		li {
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
		}

		.item {
			flex-direction: row-reverse;
			justify-content: space-between;
			align-items: center;
			padding: 1.25rem 0;
		}

		.photo {
			width: 11rem;

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				width: 6.5rem;
			}
		}

		.text {
			flex: 1;
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			.summary {
				display: none;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.photo img {
			transition: none;
		}

		.item:hover .photo img {
			transform: none;
		}
	}
`;
