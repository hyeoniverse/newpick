import { describe, expect, it } from 'vitest';
import { coverPhotos } from './CoverMosaic';

const story = (
	alt: string,
	importance?: number,
	caption = '사진 <a href="https://news.test/1?a=1&amp;b=2" target="_blank">연합뉴스</a>',
) =>
	`<article class="story story-analysis"${importance ? ` data-importance="${importance}"` : ''}><h2>${alt}</h2><figure class="story-image"><img src="https://img.test/${encodeURIComponent(alt)}.jpg?type=w860&amp;x=1" alt="${alt}" loading="lazy"><figcaption>${caption}</figcaption></figure></article>`;

describe('coverPhotos: 대표 사진 모자이크에 넣을 소식 사진', () => {
	it('중요도 높은 순, 같거나 없으면 실린 순, 최대 4장', () => {
		const html = [story('A', 2), story('B', 5), story('C'), story('D', 5), story('E', 1)].join('');
		expect(coverPhotos(html).map((p) => p.alt)).toEqual(['B', 'D', 'C', 'A']);
	});

	it('예전 글(중요도 없음)은 실린 순 · 사진 없는 소식은 건너뜀', () => {
		const html = `${story('A')}<article class="story story-brief"><h2>사진 없음</h2></article>${story('B')}`;
		expect(coverPhotos(html).map((p) => p.alt)).toEqual(['A', 'B']);
	});

	it('주소 · 출처의 HTML 이스케이프를 풀고, 출처는 label · 언론사 · 링크로', () => {
		const [photo] = coverPhotos(story('A'));
		expect(photo.src).toBe('https://img.test/A.jpg?type=w860&x=1');
		expect(photo.caption).toEqual({ label: '사진', source: '연합뉴스', href: 'https://news.test/1?a=1&b=2' });
	});

	it('Pexels 사진: "자료 사진 · Photo:" + 작가 (첫 링크)', () => {
		const caption =
			'자료 사진 · Photo: <a href="https://pexels.test/me" target="_blank">김작가</a> / <a href="https://pexels.test" target="_blank">Pexels</a>';
		expect(coverPhotos(story('A', 3, caption))[0].caption).toEqual({
			label: '자료 사진 · Photo',
			source: '김작가',
			href: 'https://pexels.test/me',
		});
	});
});
