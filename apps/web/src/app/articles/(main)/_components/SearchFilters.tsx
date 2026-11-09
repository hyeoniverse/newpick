'use client';

import { queryKeys } from '@/api/queryKeys';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPopularKeywords } from '@/api/article';
import { LuX } from 'react-icons/lu';
import { PERIOD_OPTIONS, SearchPeriod, readFilters, toPageHref, toggleKeyword } from '@/utils/newsletterSearch';
import { kstDate } from '@/utils/formatter';
import { DateRangePicker } from '@/components/common/DatePicker';

/**
 * 뉴스레터 목록 위 필터 줄 (#20): 기간 · 자주 나온 태그(여러 개 고르기).
 * 검색어는 헤더 검색칸, 고른 태그 · 조건 · 정렬은 목록 머리(ListSection), 관심사는 위 칩. 모두 주소에 남는다
 */
export default function SearchFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const filters = readFilters(searchParams);

	const go = (next: Partial<typeof filters>, push = false) => {
		const href = toPageHref({ ...filters, ...next });
		if (push) router.push(href, { scroll: false });
		else router.replace(href, { scroll: false });
	};

	// 지금 보는 관심사에서 최근 30일 자주 나온 태그
	const { data: keywords = [] } = useQuery({
		queryKey: queryKeys.keywords.popular(filters.categoryId),
		queryFn: () => fetchPopularKeywords(filters.categoryId || undefined),
		staleTime: 1000 * 60 * 10,
	});

	const custom = filters.period === 'custom';

	// 고른 기간을 다시 누르면 해제하고 전체 기간으로
	const setPeriod = (period: SearchPeriod) =>
		filters.period === period && period !== 'all'
			? go({ period: 'all' })
			: go(
					period === 'custom'
						? { period, from: filters.from || kstDate(29), to: filters.to || kstDate(0) }
						: { period },
				);

	return (
		<div className="np-articles-search-filters-search-filters">
			<div className="filters">
				<div className={custom ? 'periods custom' : 'periods'} role="group" aria-label="기간">
					{PERIOD_OPTIONS.map((option) => {
						// 직접 지정 중에는 오늘 · 1주 · 1달을 옆으로 접어 그 자리에 날짜 칸이 들어온다 (줄이 늘지 않게)
						const folded = custom && option.value !== 'all' && option.value !== 'custom';
						return (
							<button
								key={option.value}
								type="button"
								className={folded ? 'folded' : option.value === 'all' ? 'all' : undefined}
								aria-hidden={folded || undefined}
								tabIndex={folded ? -1 : undefined}
								aria-pressed={filters.period === option.value}
								onClick={() => setPeriod(option.value)}
							>
								{option.label}
							</button>
						);
					})}
					{/* 직접 지정 바로 오른쪽 */}
					{filters.period === 'custom' && (
						<DateRangePicker
							size="small"
							start={filters.from}
							end={filters.to}
							max={kstDate(0)}
							onChange={({ start, end }) => go({ from: start, to: end })}
							className="dates"
						/>
					)}
				</div>
				{filters.q && (
					<button type="button" className="keyword" onClick={() => go({ q: '' }, true)}>
						‘{filters.q}’
						<LuX aria-label="검색어 지우기" />
					</button>
				)}
			</div>
			{(keywords.length > 0 || filters.keywords.length > 0) && (
				<div className="tags" role="group" aria-label="자주 나온 태그 (최근 30일, 여러 개 고를 수 있음)">
					{/* 이름표는 제자리, 태그만 옆으로 넘긴다 */}
					<span className="tags-label">태그</span>
					<div className="tags-list">
						{/* 고른 태그가 자주 나온 태그에 없으면(상세 · 태그 전체 화면에서 들어옴) 맨 앞에 켜진 채로: 여기서 끈다 */}
						{[
							...filters.keywords
								.filter((tag) => !keywords.some(({ keyword }) => keyword === tag))
								.map((keyword) => ({ keyword, count: 0 })),
							...keywords,
						].map(({ keyword, count }) => {
							const active = filters.keywords.includes(keyword);
							return (
								<button
									key={keyword}
									type="button"
									aria-pressed={active}
									title={count ? `최근 30일 ${count}편` : undefined}
									onClick={() => go({ keywords: toggleKeyword(filters.keywords, keyword) })}
								>
									<span className="hash">#</span>
									{keyword}
								</button>
							);
						})}
					</div>
					{/* 태그 줄은 최근 자주 나온 것만. 나머지는 태그 전체 화면에서 */}
					<Link href="/tags" className="tags-all">
						전체 보기
					</Link>
				</div>
			)}
		</div>
	);
}
