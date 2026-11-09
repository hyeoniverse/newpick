import { ROUTES } from '@/constants/routes';
import { kstDate } from '@/utils/formatter';

/** 기간 고르기: 전체 · 오늘 · 1주 · 1달 · 직접 지정(from/to) */
export type SearchPeriod = 'all' | 'today' | 'week' | 'month' | 'custom';
export type SearchSort = 'latest' | 'popular';

/** 목록 화면의 검색 · 필터 상태 (#20). 모두 주소(쿼리스트링)에 남아 공유 · 뒤로 가기 · 새로 고침에도 그대로다 */
export interface NewsletterFilters {
	q: string;
	/** 고른 태그 (여러 개면 그중 하나라도 붙은 뉴스레터). 주소에는 keyword=a&keyword=b */
	keywords: string[];
	/** 태그 여러 개일 때: any(하나라도 붙은 것, 기본) · all(모두 붙은 것). 주소에는 all일 때만 match=all */
	match: 'any' | 'all';
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

type Params = Pick<URLSearchParams, 'get' | 'getAll'>;

/** 한 번에 고를 수 있는 태그 수 (API와 같다) */
export const KEYWORD_LIMIT = 5;

/** 주소의 쿼리스트링 → 필터. 모르는 값은 기본값으로 */
export function readFilters(params: Params): NewsletterFilters {
	const period = params.get('period') as SearchPeriod;
	const from = params.get('from') ?? '';
	const to = params.get('to') ?? '';
	return {
		q: (params.get('q') ?? '').trim(),
		keywords: [...new Set(params.getAll('keyword').map((k) => k.trim()))].filter(Boolean).slice(0, KEYWORD_LIMIT),
		match: params.get('match') === 'all' ? 'all' : 'any',
		categoryId: Number(params.get('categoryId')) || 0,
		period: PERIODS.includes(period) ? period : 'all',
		from: DATE.test(from) ? from : '',
		to: DATE.test(to) ? to : '',
		sort: params.get('sort') === 'popular' ? 'popular' : 'latest',
	};
}

/** 검색어나 키워드로 찾는 중인지 (목록 위 배너 대신 결과 머리말을 보여 줄 때) */
export const isSearching = (filters: NewsletterFilters) => Boolean(filters.q || filters.keywords.length);

/** 태그 하나를 켜고 끈다 (이미 고른 태그면 빼고, 아니면 더한다. 한도를 넘으면 가장 먼저 고른 것을 뺀다) */
export const toggleKeyword = (keywords: string[], keyword: string): string[] =>
	keywords.includes(keyword) ? keywords.filter((k) => k !== keyword) : [...keywords, keyword].slice(-KEYWORD_LIMIT);

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
	filters.keywords.forEach((keyword) => query.append('keyword', keyword));
	if (filters.match === 'all' && filters.keywords.length > 1) query.set('match', 'all');
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
	filters.keywords.forEach((keyword) => query.append('keyword', keyword));
	if (filters.match === 'all' && filters.keywords.length > 1) query.set('match', 'all');
	if (filters.period !== 'all') query.set('period', filters.period);
	if (filters.period === 'custom') {
		if (filters.from) query.set('from', filters.from);
		if (filters.to) query.set('to', filters.to);
	}
	if (filters.sort === 'popular') query.set('sort', 'popular');
	const qs = query.toString();
	return qs ? `${ROUTES.articles}?${qs}` : ROUTES.articles;
}

/** 필터 상태를 하나의 문자열로 (목록을 새로 받아야 하는지 비교 · Suspense key) */
export const filtersKey = (filters: NewsletterFilters) => toPageHref(filters);
