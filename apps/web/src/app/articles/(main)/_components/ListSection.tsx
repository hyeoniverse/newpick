'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { ITEMS_PER_PAGE } from '@/constants/numbers';

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
import { SearchSort, filtersKey, isSearching, readFilters, toApiQuery, toPageHref } from '@/utils/newsletterSearch';
import TagFollowButton from '@/components/common/tag/TagFollowButton';
import InputSelect from '@/components/common/InputSelect';
import { useToast } from '@/hooks/useToast';
import { cx } from '@/styles/tw';

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
	// 거르지 않은 분야 목록: 위 배너가 이미 분야 제목이라 목록 머리엔 개수 · 정렬만
	const bare = !tags.length && !isSearching(filters) && filters.period === 'all';
	const count = total !== null && (
		<Text size="small" color="subText" className="count" aria-live="polite">
			{total.toLocaleString()}건
		</Text>
	);

	// 정렬: 데스크톱은 머리 줄 오른쪽 끝(태그로 고른 목록이면 태그 줄 끝), 휴대폰은 머리 맨 아래 따로 한 줄(오른쪽 끝)
	const sortButtons = (where: 'inline' | 'row') => (
		<div className={`right-section sort-${where}`}>
			<Button data-active={filters.sort === 'latest'} onClick={() => setSort('latest')}>
				최신순
			</Button>
			<Button data-active={filters.sort === 'popular'} onClick={() => setSort('popular')}>
				인기순
			</Button>
		</div>
	);

	return (
		<StyledListSection data-track-section="articles-list">
			<div className={bare ? 'header bare' : 'header'}>
				<div className={tags.length ? 'title stack' : 'title'}>
					{tags.length ? (
						<>
							<Title as="h2" className="sr-only">
								{heading}
							</Title>
							<div className="picked-row">
								{/* 제목: 태그마다 따로 분야 제목과 같은 모양. 켜고 끄기는 위 태그 줄에서 */}
								<ul className="picked" aria-hidden>
									{tags.map((tag) => (
										<li key={tag} className="pick">
											<span className="hash">#</span>
											{tag}
										</li>
									))}
								</ul>
								{tags.length === 1 && count}
								{sortButtons('inline')}
							</div>
							{/* 태그 여러 개: 조건을 한 문장으로 — 고른 태그가 [하나라도 ▾] 들어간 뉴스레터 N건 */}
							{tags.length > 1 && (
								<div className="match">
									고른 태그가{' '}
									<InputSelect
										name="match"
										size="small"
										ariaLabel="고른 태그 조건"
										value={filters.match}
										options={[
											{ value: 'any', label: '하나라도' },
											{ value: 'all', label: '모두' },
										]}
										onChange={(value) => go({ match: value === 'all' ? 'all' : 'any' })}
										className="condition"
									/>{' '}
									들어간 뉴스레터
									{count}
									<button type="button" className="clear" onClick={() => go({ keywords: [] })}>
										지우기
									</button>
								</div>
							)}
							{/* 팔로우는 한 줄로 모은다: 메일의 '팔로우한 태그' 칸 (#123) */}
							<div className="follows">
								<span className="follows-label">팔로우</span>
								{tags.map((tag) => (
									<TagFollowButton key={tag} tag={tag} tagOnly />
								))}
							</div>
						</>
					) : (
						<>
							{/* 거르지 않은 분야 목록이면 위 배너가 이미 분야 제목('경제 뉴스레터')이라 제목은 화면 읽기용으로만, 개수만 보인다 */}
							<Title as="h2" size="extraSmall" weight="semiBold" color="primary" className={bare ? 'sr-only' : 'tag'}>
								{heading}
							</Title>
							{count}
						</>
					)}
				</div>
				{!tags.length && sortButtons('inline')}
				{tags.length > 0 && sortButtons('row')}
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
								date: article.date,
								action: <BookmarkIcon newsId={article.id} newsletterId={article.id} />,
								footer: (
									<>
										<Text color="subText">{article.date}</Text>
										<Text color="subText" className="views">
											조회수 {article.views}
										</Text>
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

const StyledListSection = ({ className, ...props }: React.ComponentProps<'section'>) => (
	<section className={cx('np-articles-list-section-list-section', className)} {...props} />
);
