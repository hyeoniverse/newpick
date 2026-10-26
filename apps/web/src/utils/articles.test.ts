import { describe, expect, it } from 'vitest';
import { mapIdToTitle, mapTitleToId } from '@/utils/mapInterests';
import { parseArticles, parseUrls } from '@/utils/parseArticles';
import { getFirstImage } from '@/utils/getFirstImage';
import { stripCodeFence } from '@/utils/stripCodeFence';
import { ArticleDetail } from '@/models/article.model';

describe('카테고리 변환', () => {
	it('id ↔ 이름', () => {
		expect(mapIdToTitle([1, 3])).toEqual(['IT', '경제']);
		expect(mapTitleToId(['IT', '경제'])).toEqual([1, 3]);
	});

	it('없는 id는 빈 문자열, 없는 이름은 빠진다', () => {
		expect(mapIdToTitle([99])).toEqual(['']);
		expect(mapTitleToId(['IT', '없는 카테고리'])).toEqual([1]);
	});
});

describe('URL 목록 문자열', () => {
	it('쉼표로 나누고 앞의 limit개만', () => {
		expect(parseUrls('https://a.com, https://b.com,https://c.com,https://d.com')).toEqual([
			'https://a.com',
			'https://b.com',
			'https://c.com',
		]);
		expect(parseUrls('https://a.com,https://b.com', 1)).toEqual(['https://a.com']);
	});

	it('문자열이 아니면 빈 배열', () => {
		expect(parseUrls(undefined)).toEqual([]);
		expect(parseUrls(['https://a.com'])).toEqual([]);
	});

	it('이미지 목록에서 첫 번째 (빈 항목은 건너뜀)', () => {
		expect(getFirstImage(' ,https://img/1.jpg,https://img/2.jpg')).toBe('https://img/1.jpg');
		expect(getFirstImage('')).toBeNull();
		expect(getFirstImage(' , ')).toBeNull();
	});
});

describe('AI 응답의 코드 블록', () => {
	// AI가 HTML을 ```html … ```로 감싸 보내는 경우가 있었다 (v1 요약 저장 실패 로그)
	it('```html로 감싼 내용은 벗겨 낸다', () => {
		expect(stripCodeFence('```html\n<div>본문</div>\n```')).toBe('<div>본문</div>');
	});

	it('감싸지 않은 내용과 다른 언어 블록은 그대로', () => {
		expect(stripCodeFence('<div>본문</div>')).toBe('<div>본문</div>');
		expect(stripCodeFence('```json\n{}\n```')).toBe('```json\n{}\n```');
	});
});

describe('parseArticles', () => {
	it('목록 카드에 필요한 모양으로 바꾼다', () => {
		const article = {
			id: 7,
			categoryId: 1,
			imageUrl: ',https://img/1.jpg',
			title: '```html\n제목\n```',
			content: '요약',
			createdAt: '2026-10-25T09:00:00+09:00',
			viewcount: 3,
		} as unknown as ArticleDetail;

		expect(parseArticles([article])).toEqual([
			{
				id: 7,
				categoryName: 'IT',
				image: 'https://img/1.jpg',
				title: '제목',
				summary: '요약',
				date: '2026-10-25',
				likes: 3,
				views: 3,
			},
		]);
	});

	it('부제목·키워드가 있으면 함께 넘기고, 없으면 키를 만들지 않는다 (#42, #50)', () => {
		const base = {
			id: 1,
			categoryId: 1,
			imageUrl: '',
			title: '제목',
			content: '요약',
			createdAt: '2026-10-27',
			viewcount: 0,
		};
		const [withSubtitle, without] = parseArticles([
			{ ...base, subtitle: '부제목', keywords: ['코스피'] } as unknown as ArticleDetail,
			{ ...base, subtitle: null } as unknown as ArticleDetail,
		]);
		expect(withSubtitle.subtitle).toBe('부제목');
		expect(withSubtitle.keywords).toEqual(['코스피']);
		expect(without).not.toHaveProperty('subtitle');
		expect(without).not.toHaveProperty('keywords');
	});
});
