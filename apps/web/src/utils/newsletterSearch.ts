import { kstDate } from '@/utils/formatter';

/** 기간 고르기: 전체 · 오늘 · 1주 · 1달 · 직접 지정(from/to) */
export type SearchPeriod = 'all' | 'today' | 'week' | 'month' | 'custom';
export type SearchSort = 'latest' | 'popular';

/** 목록 화면의 검색 · 필터 상태 (#20). 모두 주소(쿼리스트링)에 남아 공유 · 뒤로 가기 · 새로 고침에도 그대로다 */
export interface NewsletterFilters {
	q: string;
	keyword: string;
	categoryId: number;
	period: SearchPeriod;
	from: string;
	to: string;
	sort: SearchSort;
}

export const PERIOD_OPTIONS: { value: SearchPeriod; label: string }[] = [
	{ value: 'all', label: '전체 기간' },
	{ value: 'today', label: '오늘' },
	{ value: 'week', label: '1주' },
	{ value: 'month', label: '1달' },
	{ value: 'custom', label: '직접 지정' },
];

const PERIODS = PERIOD_OPTIONS.map((option) => option.value);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Params = Pick<URLSearchParams, 'get'>;

/** 주소의 쿼리스트링 → 필터. 모르는 값은 기본값으로 */
export function readFilters(params: Params): NewsletterFilters {
	const period = params.get('period') as SearchPeriod;
	const from = params.get('from') ?? '';
	const to = params.get('to') ?? '';
	return {
		q: (params.get('q') ?? '').trim(),
		keyword: (params.get('keyword') ?? '').trim(),
		categoryId: Number(params.get('categoryId')) || 0,
		period: PERIODS.includes(period) ? period : 'all',
		from: DATE.test(from) ? from : '',
		to: DATE.test(to) ? to : '',
		sort: params.get('sort') === 'popular' ? 'popular' : 'latest',
	};
}

/** 검색어나 키워드로 찾는 중인지 (목록 위 배너 대신 결과 머리말을 보여 줄 때) */
export const isSearching = (filters: NewsletterFilters) => Boolean(filters.q || filters.keyword);

/** 기간 → API에 보낼 KST 날짜 범위 */
export function periodRange(filters: NewsletterFilters, now = new Date()): { from?: string; to?: string } {
	switch (filters.period) {
		case 'today':
			return { from: kstDate(0, now), to: kstDate(0, now) };
		case 'week':
			return { from: kstDate(6, now), to: kstDate(0, now) };
		case 'month':
			return { from: kstDate(29, now), to: kstDate(0, now) };
		case 'custom':
			return { from: filters.from || undefined, to: filters.to || undefined };
		default:
			return {};
	}
}

/** 필터 → 검색 API 쿼리스트링 */
export function toApiQuery(filters: NewsletterFilters, limit: number, offset: number, now = new Date()): string {
	const query = new URLSearchParams();
	if (filters.q.length >= 2) query.set('q', filters.q);
	if (filters.keyword) query.set('keyword', filters.keyword);
	if (filters.categoryId) query.set('categoryId', String(filters.categoryId));
	const { from, to } = periodRange(filters, now);
	if (from) query.set('from', from);
	if (to) query.set('to', to);
	if (filters.sort === 'popular') query.set('sort', 'popular');
	query.set('limit', String(limit));
	query.set('offset', String(offset));
	return query.toString();
}

/** 필터 → 목록 화면 주소. 기본값은 빼서 주소를 짧게 */
export function toPageHref(filters: NewsletterFilters): string {
	const query = new URLSearchParams();
	if (filters.categoryId) query.set('categoryId', String(filters.categoryId));
	if (filters.q) query.set('q', filters.q);
	if (filters.keyword) query.set('keyword', filters.keyword);
	if (filters.period !== 'all') query.set('period', filters.period);
	if (filters.period === 'custom') {
		if (filters.from) query.set('from', filters.from);
		if (filters.to) query.set('to', filters.to);
	}
	if (filters.sort === 'popular') query.set('sort', 'popular');
	const qs = query.toString();
	return qs ? `/articles?${qs}` : '/articles';
}

/** 필터 상태를 하나의 문자열로 (목록을 새로 받아야 하는지 비교 · Suspense key) */
export const filtersKey = (filters: NewsletterFilters) => toPageHref(filters);
