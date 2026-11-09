'use client';

import { queryKeys } from '@/api/queryKeys';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LuSearch, LuTags, LuChevronDown } from 'react-icons/lu';
import { fetchAllKeywords, KeywordStat } from '@/api/article';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { kstDate } from '@/utils/formatter';
import { toPageHref, readFilters } from '@/utils/newsletterSearch';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import FilterChips from '@/components/common/FilterChips';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/constants/errors';

type Sort = 'count' | 'recent' | 'name';

const SORTS: { value: Sort; label: string }[] = [
	{ value: 'count', label: '많이 쓴 순' },
	{ value: 'recent', label: '최근 순' },
	{ value: 'name', label: '가나다순' },
];

/** 한 번만 나온 태그 중 이 날 수가 지난 것은 '오래된 태그'로 접어 둔다 */
const RECENT_DAYS = 30;

const sorters: Record<Sort, (a: KeywordStat, b: KeywordStat) => number> = {
	count: (a, b) => b.count - a.count || b.lastUsedAt.localeCompare(a.lastUsedAt),
	recent: (a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt) || b.count - a.count,
	name: (a, b) => a.keyword.localeCompare(b.keyword, 'ko'),
};

/** 태그를 누르면 그 태그가 붙은 뉴스레터 목록으로 (관심사는 고른 것 그대로) */
const tagHref = (keyword: string, categoryId: number) =>
	toPageHref({ ...readFilters(new URLSearchParams()), keywords: [keyword], categoryId });

/**
 * 태그 전체 (#20). 매일 태그가 늘어나므로 세 묶음으로 정돈한다:
 * 자주 쓴 태그(두 번 이상) · 최근 태그(30일 안에 한 번) · 오래된 태그(그 밖, 접어 둠).
 * 관심사 · 이름 일부 · 정렬로 좁힌다
 */
export default function TagIndex() {
	const [category, setCategory] = useState('');
	const [q, setQ] = useState('');
	const [sort, setSort] = useState<Sort>('count');
	const [showOld, setShowOld] = useState(false);
	const categoryId = Number(category) || 0;

	const { data, isPending, isError, error, refetch } = useQuery({
		queryKey: queryKeys.keywords.byCategory(categoryId),
		queryFn: () => fetchAllKeywords(categoryId || undefined),
		staleTime: 1000 * 60 * 10,
		placeholderData: (previous) => previous,
	});

	const groups = useMemo(() => {
		const since = kstDate(RECENT_DAYS - 1);
		const needle = q.trim().toLowerCase();
		const list = (data ?? []).filter((k) => !needle || k.keyword.toLowerCase().includes(needle)).sort(sorters[sort]);
		return {
			frequent: list.filter((k) => k.count >= 2),
			recent: list.filter((k) => k.count < 2 && k.lastUsedAt.slice(0, 10) >= since),
			old: list.filter((k) => k.count < 2 && k.lastUsedAt.slice(0, 10) < since),
			total: list.length,
		};
	}, [data, q, sort]);

	const chips = (list: KeywordStat[]) => (
		<ul className="tag-list">
			{list.map((k) => (
				<li key={k.keyword}>
					<Link
						href={tagHref(k.keyword, categoryId)}
						className="tag"
						title={`${k.count}편 · 마지막 ${k.lastUsedAt.slice(0, 10)}`}
					>
						<span className="hash">#</span>
						{k.keyword}
						{k.count >= 2 && <span className="count">{k.count}</span>}
					</Link>
				</li>
			))}
		</ul>
	);

	return (
		<div className="np-tags-tag-index-tag-index">
			<header className="head">
				<Title size="extraSmall" weight="bold">
					태그
				</Title>
				<Text size="small" color="subText">
					뉴스레터에 붙은 태그를 모았어요. 누르면 그 태그가 붙은 뉴스레터를 볼 수 있어요.
				</Text>
			</header>

			<div className="controls">
				<FilterChips label="관심사" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
				<div className="row">
					<label className="search">
						<LuSearch aria-hidden />
						<input
							type="search"
							value={q}
							onChange={(event) => setQ(event.target.value)}
							placeholder="태그 이름으로 찾기"
							aria-label="태그 이름으로 찾기"
							maxLength={30}
						/>
					</label>
					<div className="sorts" role="group" aria-label="정렬">
						{SORTS.map((s) => (
							<button key={s.value} type="button" aria-pressed={sort === s.value} onClick={() => setSort(s.value)}>
								{s.label}
							</button>
						))}
					</div>
				</div>
			</div>

			{isPending ? (
				<Skeleton />
			) : isError ? (
				<ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />
			) : groups.total === 0 ? (
				<EmptyState
					icon={LuTags}
					title={q ? `‘${q}’이(가) 들어간 태그가 없어요` : '아직 태그가 없어요'}
					description="다른 이름으로 찾거나 관심사를 바꿔 보세요."
				/>
			) : (
				<>
					{groups.frequent.length > 0 && (
						<section className="group" aria-labelledby="tags-frequent">
							<h2 id="tags-frequent">
								자주 쓴 태그 <span className="n">{groups.frequent.length}</span>
							</h2>
							{chips(groups.frequent)}
						</section>
					)}
					{groups.recent.length > 0 && (
						<section className="group" aria-labelledby="tags-recent">
							<h2 id="tags-recent">
								최근 태그 <span className="n">{groups.recent.length}</span>
								<span className="hint">최근 {RECENT_DAYS}일에 한 번</span>
							</h2>
							{chips(groups.recent)}
						</section>
					)}
					{groups.old.length > 0 && (
						<section className="group" aria-labelledby="tags-old">
							<h2 id="tags-old">
								<button type="button" className="fold" aria-expanded={showOld} onClick={() => setShowOld(!showOld)}>
									오래된 태그 <span className="n">{groups.old.length}</span>
									<LuChevronDown aria-hidden />
								</button>
							</h2>
							{showOld && chips(groups.old)}
						</section>
					)}
				</>
			)}
		</div>
	);
}
