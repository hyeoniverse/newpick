'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { ITEMS_PER_PAGE } from '@/constants/numbers';

import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Spinner from '@/components/common/loader/Spinner';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import { useSearchParams } from 'next/navigation';
import { mapIdToTitle } from '@/utils/mapInterests';
import { sortNewsletters } from '@/utils/queryNewsletters';
import { fetchArticleList } from '@/api/article';

interface Props {
	initialArticles: IArticleSummary[];
}

export default function ListSection({ initialArticles }: Props) {
	const searchParams = useSearchParams();
	const categoryId = searchParams.get('categoryId'); // Query Parameter 가져오기
	const categoryName = mapIdToTitle([Number(categoryId)])[0]; // Query Parameter를 카테고리 이름으로 변환

	const [articles, setArticles] = useState<IArticleSummary[]>(initialArticles);
	const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 (0부터 시작하는 offset 계산을 위해)
	const [isLoading, setIsLoading] = useState(false); // 데이터 로딩 상태
	const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지 여부
	const [selectedSort, setSelectedSort] = useState<'latest' | 'bookmarks' | 'views'>('latest');
	const observerRef = useRef<HTMLDivElement | null>(null);

	// API를 통해 다음 페이지 데이터를 불러오는 함수
	const loadMoreArticles = useCallback(async () => {
		setIsLoading(true);
		try {
			// offset은 현재까지 불러온 데이터 수와 동일 (currentPage가 1부터 시작한다고 가정)
			const offset = currentPage * ITEMS_PER_PAGE;
			const response = await fetchArticleList(ITEMS_PER_PAGE, offset);
			const newArticles: IArticleSummary[] = response.data;

			// 만약 새로 불러온 데이터 수가 ITEMS_PER_PAGE보다 작으면 더 이상 불러올 데이터가 없음
			if (newArticles.length < ITEMS_PER_PAGE) {
				setHasMore(false);
			}

			// 기존 데이터와 중복이 없도록 합침
			setArticles((prev) => {
				const existingIds = new Set(prev.map((article) => article.id));
				const uniqueNewArticles = newArticles.filter((article) => !existingIds.has(article.id));
				return [...prev, ...uniqueNewArticles];
			});
			// 다음 페이지를 위해 페이지 번호 증가
			setCurrentPage((prev) => prev + 1);
		} catch (error) {
			console.error('추가 데이터를 불러오는 중 에러 발생:', error);
		} finally {
			setIsLoading(false);
		}
	}, [currentPage]);

	// 무한 스크롤을 처리하는 Intersection Observer
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				// 첫 번째 요소가 100% 노출되고, 로딩 중이 아니며 더 불러올 데이터가 있으면 로드
				if (entries[0].isIntersecting && !isLoading && hasMore) {
					loadMoreArticles();
				}
			},
			{ threshold: 1.0 }
		);

		const currentObserver = observerRef.current;
		if (currentObserver) {
			observer.observe(currentObserver);
		}
		return () => {
			if (currentObserver) {
				observer.unobserve(currentObserver);
			}
		};
	}, [isLoading, hasMore, loadMoreArticles]);

	// 선택된 정렬 방식에 따라 데이터 정렬
	const sortedNewsletters = sortNewsletters(articles, selectedSort);

	return (
		<StyledListSection>
			<div className="header">
				<div className="title">
					<Title size="extraSmall" weight="semiBold" color="primary" className="tag">
						전체
					</Title>
					<Title size="extraSmall" weight="semiBold">
						{categoryName} 뉴스레터
					</Title>
				</div>
				<div className="right-section">
					<Button
						style={{ width: '6rem' }}
						data-active={selectedSort === 'latest'}
						onClick={() => setSelectedSort('latest')}
					>
						최신순
					</Button>
					<Button
						style={{ width: '6rem' }}
						data-active={selectedSort === 'bookmarks'}
						onClick={() => setSelectedSort('bookmarks')}
					>
						북마크순
					</Button>
				</div>
			</div>

			<div className="newsletter-cards">
				<hr />
				{sortedNewsletters.map((newsletter, index) => (
					<Card
						type="list"
						key={`${newsletter.id}-${index}`}
						data={{
							id: newsletter.id,
							image: newsletter.image,
							header: newsletter.categoryName,
							main: {
								title: newsletter.title,
								description: newsletter.summary,
							},
							footer: (
								<>
									<Text color="subText">{newsletter.date}</Text>

									<div className="right">
										<BookmarkIcon newsId={newsletter.id} newsletterId={newsletter.id} />
									</div>
								</>
							),
						}}
					/>
				))}
			</div>
			<div ref={observerRef} className="observer">
				{isLoading && <Spinner />}
			</div>
		</StyledListSection>
	);
}

const StyledListSection = styled.section`
	width: 100%;
	height: fit-content;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;

	.title {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
		gap: 1rem;

		.tag {
			border-radius: ${({ theme }) => theme.borderRadius.capsule};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
			padding: 0.25rem 1rem;
		}
	}

	.newsletter-cards {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
	}

	.observer {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 1rem;
	}
`;
