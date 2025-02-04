'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';
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
import { filterByCategories, sortNewsletters } from '@/utils/queryNewsletters';
import { parseArticles } from '@/utils/parseArticles';
import { getArticleList, getCategoryList } from '@/hooks/useArticle';

export default function ListSection() {
	const searchParams = useSearchParams();
	const categoryId = searchParams.get('categoryId'); // Query Parameter 가져오기
	const categoryName = mapIdToTitle([Number(categoryId)])[0]; // Query Parameter를 카테고리 이름으로 변환

	const [articles, setArticles] = useState<IArticleSummary[]>([]);
	const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 (0부터 시작하는 offset 계산을 위해)
	const [isLoading, setIsLoading] = useState(false); // 데이터 로딩 상태
	const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지 여부
	const [selectedSort, setSelectedSort] = useState<'latest' | 'bookmarks' | 'views'>('latest');
	const [shouldLoad, setShouldLoad] = useState(false); // 데이터 로딩 트리거 상태 추가
	const observerRef = useRef<HTMLDivElement | null>(null);

	// API를 통해 다음 페이지 데이터를 불러오는 함수
	const loadMoreArticles = useCallback(async () => {
		if (isLoading) return;
		setIsLoading(true);

		try {
			// 여분의 1개를 포함하여 요청
			const fetchLimit = ITEMS_PER_PAGE + 1;
			const offset = currentPage * ITEMS_PER_PAGE;
			let fetchedArticles: IArticleDetail[] = [];

			if (categoryName === '전체') {
				fetchedArticles = await getArticleList(fetchLimit, offset);
			} else {
				fetchedArticles = await getCategoryList(Number(categoryId), fetchLimit, offset);
			}

			const parsedArticles = parseArticles(fetchedArticles);
			let newArticles = filterByCategories(parsedArticles, [categoryName]);

			// 여분의 아이템 패턴 적용: 만약 가져온 데이터가 ITEMS_PER_PAGE+1개라면, 화면에는 ITEMS_PER_PAGE개만 표시
			if (newArticles.length > ITEMS_PER_PAGE) {
				newArticles = newArticles.slice(0, ITEMS_PER_PAGE);
			} else {
				setHasMore(false);
			}

			setArticles((prev) => {
				const existingIds = new Set(prev.map((article) => article.id));
				const uniqueNewArticles = newArticles.filter((article) => !existingIds.has(article.id));
				return [...prev, ...uniqueNewArticles];
			});

			setCurrentPage((prev) => prev + 1);
		} catch (error) {
			console.error('추가 데이터를 불러오는 중 에러 발생:', error);
		} finally {
			setIsLoading(false);
		}
	}, [currentPage, isLoading, categoryName, categoryId]);

	useEffect(() => {
		// 카테고리가 바뀌면 기존 데이터를 초기화하고 정렬 방식도 'latest'로 재설정합니다.
		setArticles([]); // 기존 데이터 초기화
		setCurrentPage(0);
		setHasMore(true);
		setShouldLoad(true); // 새로운 데이터 로드를 위한 상태 업데이트
	}, [categoryId, selectedSort]); // categoryId가 변경될 때만 실행

	useEffect(() => {
		setSelectedSort('latest'); // 카테고리 변경 시 정렬 방식을 초기화
	}, [categoryId]); // categoryId가 변경될 때만 실행

	// shouldLoad이 true일 때만 새로운 데이터 불러오기
	useEffect(() => {
		if (shouldLoad) {
			loadMoreArticles();
			setShouldLoad(false); // 데이터 로딩 후 다시 false로 변경하여 무한 호출 방지
		}
	}, [shouldLoad, loadMoreArticles]); // shouldLoad이 true일 때만 loadMoreArticles 실행

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
	const sortedArticles = sortNewsletters(articles, selectedSort);

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
						data-active={selectedSort === 'views'}
						onClick={() => setSelectedSort('views')}
					>
						인기순
					</Button>
				</div>
			</div>

			<div className="newsletter-cards">
				<hr />
				{sortedArticles.map((article, index) => (
					<Card
						type="list"
						key={`${article.id}-${index}`}
						data={{
							id: article.id,
							url: `/articles/detail/${article.id}`,
							image: article.image,
							header: article.categoryName,
							main: {
								title: article.title,
								description: article.summary,
							},
							footer: (
								<>
									<Text color="subText">{article.date}</Text>

									<div className="right">
										<BookmarkIcon newsId={article.id} newsletterId={article.id} />
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

	.header {
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;

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

		.right-section {
			display: flex;
			flex-direction: row;
			justify-content: flex-end;
			align-items: center;
			gap: 1rem;

			button[data-active='true'] {
				background: ${({ theme }) => theme.color.tertiary};
				color: ${({ theme }) => theme.color.primary};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			}
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
