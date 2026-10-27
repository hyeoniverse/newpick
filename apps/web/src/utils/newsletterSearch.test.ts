import { describe, expect, it } from 'vitest';
import { readFilters, toApiQuery, toPageHref } from '@/utils/newsletterSearch';

const params = (qs: string) => new URLSearchParams(qs);
// 2026-10-27 12:00 KST
const NOW = new Date('2026-10-27T03:00:00Z');

describe('newsletterSearch (#20)', () => {
	it('주소를 필터로 읽고, 모르는 값은 기본값으로', () => {
		expect(readFilters(params('q= 코스피 &categoryId=3&period=week&sort=popular'))).toEqual({
			q: '코스피',
			keyword: '',
			categoryId: 3,
			period: 'week',
			from: '',
			to: '',
			sort: 'popular',
		});
		expect(readFilters(params('period=year&sort=x&from=2026/10/01'))).toMatchObject({
			period: 'all',
			sort: 'latest',
			from: '',
		});
	});

	it('기간을 KST 날짜 범위로 바꿔 API에 보낸다', () => {
		const week = toApiQuery(readFilters(params('period=week')), 11, 0, NOW);
		expect(week).toBe('from=2026-10-21&to=2026-10-27&limit=11&offset=0');
		const custom = toApiQuery(readFilters(params('period=custom&from=2026-10-01&to=2026-10-10')), 11, 10, NOW);
		expect(custom).toBe('from=2026-10-01&to=2026-10-10&limit=11&offset=10');
	});

	it('1글자 검색어는 보내지 않는다 (API가 거절)', () => {
		expect(toApiQuery(readFilters(params('q=a')), 11, 0, NOW)).toBe('limit=11&offset=0');
	});

	it('화면 주소는 기본값을 빼서 짧게', () => {
		expect(toPageHref(readFilters(params('')))).toBe('/articles');
		expect(toPageHref(readFilters(params('keyword=코스피&period=all&sort=latest')))).toBe(
			'/articles?keyword=%EC%BD%94%EC%8A%A4%ED%94%BC',
		);
	});
});
