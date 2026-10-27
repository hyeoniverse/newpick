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
import { useRouter, useSearchParams } from 'next/navigation';
import { LuSearchX } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import { mapIdToTitle } from '@/utils/mapInterests';
import { parseArticles } from '@/utils/parseArticles';
import { fetchSearchNewsletters } from '@/api/article';
import {
	SearchSort,
	filtersKey,
	isSearching,
	readFilters,
	toApiQuery,
	toPageHref,
} from '@/utils/newsletterSearch';
import { useToast } from '@/hooks/useToast';

interface Props {
	/** 배너에 띄운 글. 목록에서 다시 보여 주지 않는다 */
	excludeId?: number;
}

export default function ListSection({ excludeId }: Props) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { showToast } = useToast();
	// 검색 · 필터 상태는 모두 주소에 있다 (#20). 같은 상태면 같은 key
	const filters = readFilters(searchParams);
	const key = filtersKey(filters);
	const searching = isSearching(filters);
	const categoryName = mapIdToTitle([filters.categoryId])[0];

	const [articles, setArticles] = useState<IArticleSummary[]>([]);
	const [total, setTotal] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false); // 데이터 로딩 상태
	const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지 여부
	const observerRef = useRef<HTMLDivElement | null>(null);
	// 처음 불러오기와 화면 끝 감지가 같은 순간에 부르면, isLoading(state)은 다음 렌더링에야 바뀌어
	// 둘 다 요청을 보낸다 (요청 2번·실패 알림 2번). ref로 바로 막는다
	const loadingRef = useRef(false);
	// 필터가 바뀐 뒤 늦게 도착한 이전 필터의 응답은 버린다
	const keyRef = useRef(key);
	const offsetRef = useRef(0);

	// API를 통해 다음 페이지 데이터를 불러오는 함수
	const loadMoreArticles = useCallback(async () => {
		if (loadingRef.current) return;
		loadingRef.current = true;
		setIsLoading(true);
		const requestKey = keyRef.current;

		try {
			// 여분의 1개를 포함하여 요청: ITEMS_PER_PAGE+1개가 오면 다음 페이지가 있다
			const { items, total } = await fetchSearchNewsletters(
				toApiQuery(readFilters(searchParams), ITEMS_PER_PAGE + 1, offsetRef.current),
			);
			if (requestKey !== keyRef.current) return;

			const newArticles = parseArticles(items).slice(0, ITEMS_PER_PAGE);
			setHasMore(items.length > ITEMS_PER_PAGE);
			setTotal(total);
			offsetRef.current += ITEMS_PER_PAGE;
			setArticles((prev) => {
				const existingIds = new Set(prev.map((article) => article.id));
				return [...prev, ...newArticles.filter((article) => !existingIds.has(article.id))];
			});
		} catch {
			// 실패한 채로 두면 화면 끝에 닿을 때마다 다시 요청하므로, 더 불러오지 않고 알립니다.
			setHasMore(false);
			showToast('뉴스레터를 더 불러오지 못했습니다.', 'error');
		} finally {
			loadingRef.current = false;
			setIsLoading(false);
		}
	}, [searchParams, showToast]);

	// 필터가 바뀌면 처음부터 다시
	useEffect(() => {
		keyRef.current = key;
		offsetRef.current = 0;
		loadingRef.current = false;
		setArticles([]);
		setTotal(null);
		setHasMore(true);
		loadMoreArticles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	// 무한 스크롤을 처리하는 Intersection Observer
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				// 첫 번째 요소가 100% 노출되고, 로딩 중이 아니며 더 불러올 데이터가 있으면 로드
				if (entries[0].isIntersecting && !isLoading && hasMore && articles.length > 0) {
					loadMoreArticles();
				}
			},
			{ threshold: 1.0 },
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
	}, [isLoading, hasMore, articles.length, loadMoreArticles]);

	const setSort = (sort: SearchSort) => router.replace(toPageHref({ ...filters, sort }), { scroll: false });

	// 배너에 띄운 글은 관심사 첫 화면에서만 빼고(검색 · 필터 중엔 그대로)
	const plain = !searching && filters.period === 'all';
	const shown = plain ? articles.filter((article) => article.id !== excludeId) : articles;
	const heading = filters.q ? `‘${filters.q}’ 검색 결과` : filters.keyword ? `#${filters.keyword}` : categoryName;

	return (
		<StyledListSection>
			<div className="header">
				<div className="title">
					<Title as="h2" size="extraSmall" weight="semiBold" color="primary" className="tag">
						{heading}
					</Title>
					{total !== null && (
						<Text size="small" color="subText" className="count" aria-live="polite">
							{total.toLocaleString()}건
						</Text>
					)}
				</div>
				<div className="right-section">
					<Button data-active={filters.sort === 'latest'} onClick={() => setSort('latest')}>
						최신순
					</Button>
					<Button data-active={filters.sort === 'popular'} onClick={() => setSort('popular')}>
						인기순
					</Button>
				</div>
			</div>
			{total === 0 && !isLoading ? (
				<EmptyState
					icon={LuSearchX}
					title="찾는 뉴스레터가 없어요"
					description={'검색어를 바꾸거나 기간 · 관심사를 넓혀 보세요.'}
					action={{ label: '조건 지우기', href: '/articles' }}
				/>
			) : (
				<div className="newsletter-cards">
					{shown.map((article, index) => (
						<Card
							type="list"
							key={`${article.id}-${index}`}
							highlight={filters.q}
							data={{
								id: article.id,
								url: `/articles/detail/${article.id}`,
								image: article.image,
								header: article.categoryName,
								main: {
									title: article.title,
									// 부제목이 있으면 본문 앞부분 대신 (#42)
									description: article.subtitle || article.summary,
									tags: article.keywords,
								},
								footer: (
									<>
										<Text color="subText">{article.date}</Text>
										<Text color="subText">|&nbsp;&nbsp;조회수 {article.views}</Text>
										<div className="right">
											<BookmarkIcon newsId={article.id} newsletterId={article.id} />
										</div>
									</>
								),
							}}
						/>
					))}
				</div>
			)}
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
	margin-top: 2rem;

	hr {
		width: 100%;
		border: none;
		margin: 0;
		padding: 0;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
	}

	.header {
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			flex-wrap: wrap;

			.right-section {
				margin-top: 1rem;
			}
		}

		.title {
			display: flex;
			flex-direction: row;
			justify-content: flex-start;
			align-items: center;
			gap: 1rem;

			h1 {
				white-space: nowrap;
			}

			.count {
				font-variant-numeric: tabular-nums;
				white-space: nowrap;
			}

			.tag {
				max-width: 22rem;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				border-radius: ${({ theme }) => theme.radius.chip};
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
