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
import { LuSearchX, LuX } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import { mapIdToTitle } from '@/utils/mapInterests';
import { parseArticles } from '@/utils/parseArticles';
import { fetchSearchNewsletters } from '@/api/article';
import { SearchSort, filtersKey, readFilters, toApiQuery, toPageHref, toggleKeyword } from '@/utils/newsletterSearch';
import TagFollowButton from '@/components/common/tag/TagFollowButton';
import { useToast } from '@/hooks/useToast';

export default function ListSection() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { showToast } = useToast();
	// 검색 · 필터 상태는 모두 주소에 있다 (#20). 같은 상태면 같은 key
	const filters = readFilters(searchParams);
	const key = filtersKey(filters);
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

	const go = (next: Partial<typeof filters>) => router.replace(toPageHref({ ...filters, ...next }), { scroll: false });
	const setSort = (sort: SearchSort) => go({ sort });

	// 태그로 고른 목록: 제목 자리에 고른 태그 칩 (칩마다 팔로우 · 빼기)
	const tags = filters.q ? [] : filters.keywords;
	const heading = filters.q
		? `‘${filters.q}’ 검색 결과`
		: tags.length
			? tags.map((k) => `#${k}`).join(filters.match === 'all' ? ' + ' : ' · ')
			: categoryName;
	const count = total !== null && (
		<Text size="small" color="subText" className="count" aria-live="polite">
			{total.toLocaleString()}건
		</Text>
	);

	return (
		<StyledListSection data-track-section="articles-list">
			<div className="header">
				<div className={tags.length > 1 ? 'title stack' : 'title'}>
					{tags.length ? (
						<>
							<Title as="h2" className="sr-only">
								{heading}
							</Title>
							<ul className="picked" aria-label="고른 태그">
								{tags.map((tag) => (
									<li key={tag} className="pick">
										<span className="name">#{tag}</span>
										<TagFollowButton tag={tag} short className="follow" />
										<button
											type="button"
											className="remove"
											aria-label={`#${tag} 빼기`}
											onClick={() => go({ keywords: toggleKeyword(tags, tag) })}
										>
											<LuX aria-hidden />
										</button>
									</li>
								))}
							</ul>
							{tags.length === 1 && count}
							{/* 태그 여러 개: 조건을 한 문장으로 — 고른 태그가 [하나라도 ▾] 들어간 뉴스레터 N건 */}
							{tags.length > 1 && (
								<div className="match">
									<label>
										고른 태그가{' '}
										<select
											value={filters.match}
											aria-label="고른 태그 조건"
											onChange={(e) => go({ match: e.target.value === 'all' ? 'all' : 'any' })}
										>
											<option value="any">하나라도</option>
											<option value="all">모두</option>
										</select>{' '}
										들어간 뉴스레터
									</label>
									{count}
									<button type="button" className="clear" onClick={() => go({ keywords: [] })}>
										지우기
									</button>
								</div>
							)}
						</>
					) : (
						<>
							<Title as="h2" size="extraSmall" weight="semiBold" color="primary" className="tag">
								{heading}
							</Title>
							{count}
						</>
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
					{articles.map((article, index) => (
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

		/* 두 줄(칩 · 조건 문장)이면 정렬 단추는 칩 줄 높이에 */
		&:has(.stack) {
			align-items: flex-start;

			.right-section {
				margin-top: 0.375rem;
			}
		}

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

			/* 태그 여러 개: 칩 줄 아래에 조건 문장 (휴대폰에서도 정렬 단추보다 먼저) */
			&.stack {
				flex-direction: column;
				align-items: flex-start;
				gap: 0.75rem;
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

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	/* 고른 태그 칩: 연한 강조색 바탕에 태그 이름, 안에 팔로우 · 빼기 */
	.picked {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.pick {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.3125rem 0.375rem 0.3125rem 1rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.tertiary};

		.name {
			margin-right: 0.25rem;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			white-space: nowrap;
		}

		.follow {
			padding: 0.1875rem 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}

		.remove {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 1.625rem;
			height: 1.625rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: 50%;
			background: ${({ theme }) => theme.color.background};
			color: ${({ theme }) => theme.color.subText};
			cursor: pointer;

			svg {
				width: 0.875rem;
				height: 0.875rem;
			}

			&:hover {
				border-color: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	/* 조건 문장: 고른 쪽만 강조색 테두리 칸 */
	.match {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.5rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
		color: ${({ theme }) => theme.color.text};

		select {
			margin: 0 0.125rem;
			padding: 0.25rem 1.75rem 0.25rem 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.primary};
			border-radius: 0.5rem;
			background: ${({ theme }) => theme.color.background}
				url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0h10L5 6z' fill='%233610e1'/%3E%3C/svg%3E")
				no-repeat right 0.625rem center;
			appearance: none;
			font: inherit;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
			cursor: pointer;
		}

		.count {
			margin-left: -0.25rem;
		}

		.clear {
			margin-left: 0.25rem;
			padding: 0.25rem;
			border: none;
			background: transparent;
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
			cursor: pointer;

			&:hover {
				color: ${({ theme }) => theme.color.primary};
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
