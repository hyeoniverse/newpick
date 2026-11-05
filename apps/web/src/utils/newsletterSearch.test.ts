import { describe, expect, it } from 'vitest';
import { KEYWORD_LIMIT, readFilters, toApiQuery, toggleKeyword, toPageHref } from '@/utils/newsletterSearch';

const params = (qs: string) => new URLSearchParams(qs);
// 2026-10-27 12:00 KST
const NOW = new Date('2026-10-27T03:00:00Z');

describe('newsletterSearch (#20)', () => {
	it('주소를 필터로 읽고, 모르는 값은 기본값으로', () => {
		expect(readFilters(params('q= 코스피 &categoryId=3&period=week&sort=popular'))).toEqual({
			q: '코스피',
			keywords: [],
			match: 'any',
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

	it('태그 여러 개: 주소에 keyword를 여러 번, API에도 그대로 (예전 태그 하나 주소도 그대로 열림)', () => {
		const filters = readFilters(params('keyword=룰라&keyword=코스피&keyword=룰라&keyword= '));
		expect(filters.keywords).toEqual(['룰라', '코스피']);
		expect(toPageHref(filters)).toBe(
			`/articles?keyword=${encodeURIComponent('룰라')}&keyword=${encodeURIComponent('코스피')}`,
		);
		expect(toApiQuery(filters, 11, 0, NOW)).toBe(
			`keyword=${encodeURIComponent('룰라')}&keyword=${encodeURIComponent('코스피')}&limit=11&offset=0`,
		);
	});

	it('태그 켜고 끄기: 고른 태그를 누르면 빼고, 한도를 넘으면 가장 먼저 고른 것을 뺀다', () => {
		expect(toggleKeyword(['룰라'], '코스피')).toEqual(['룰라', '코스피']);
		expect(toggleKeyword(['룰라', '코스피'], '룰라')).toEqual(['코스피']);
		const full = Array.from({ length: KEYWORD_LIMIT }, (_, i) => `태그${i}`);
		expect(toggleKeyword(full, '새 태그')).toEqual([...full.slice(1), '새 태그']);
	});

	it('태그 조건: 모두(AND)면 주소 · API에 match=all, 태그가 하나면 붙이지 않는다', () => {
		const both = readFilters(params('keyword=룰라&keyword=코스피&match=all'));
		expect(both.match).toBe('all');
		expect(toPageHref(both)).toContain('match=all');
		expect(toApiQuery(both, 11, 0, NOW)).toContain('match=all');
		expect(toPageHref(readFilters(params('keyword=룰라&match=all')))).not.toContain('match');
		expect(readFilters(params('keyword=룰라&match=x')).match).toBe('any');
	});
});
