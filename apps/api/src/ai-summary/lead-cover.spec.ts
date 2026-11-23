import { coverImages } from './ai-summary.service';
import { renderNewsletterHtml } from './newsletter-html';
import { importanceOf } from './writer/normalize';
import { WRITER_SCHEMA } from './writer/schema';
import { Story } from './writer/types';
import { writerPrompt } from './writer/write-prompt';

const story = (heading: string, importance?: number, image?: string): Story => ({
	template: 'analysis',
	kicker: '',
	heading,
	lead: '리드',
	body: '본문',
	analysis: '',
	stats: [],
	timeline: [],
	qa: [],
	quote: { text: '', by: '' },
	debate: [],
	sources: [1],
	imageQuery: '',
	...(importance && { importance }),
	...(image && { image: { url: image, alt: heading, credit: '연합뉴스', provider: 'article' as const } }),
});

describe('제목 · 부제 · 대표 사진은 가장 중요한 소식으로', () => {
	it('쓰기 프롬프트: 제목은 중요도가 가장 높은 소식, 부제는 그 소식을 풀어 쓴 문장 (예전: 부제 = 나머지 소식이라 제목과 따로 놀았다)', () => {
		const prompt = writerPrompt([{ index: 0, title: '기사', content: '내용' }], 'IT');
		expect(prompt).toContain('title: importance가 가장 높은 소식');
		expect(prompt).toContain('subtitle: title이 다룬 그 소식을 풀어 쓴 한 문장');
		expect(prompt).not.toContain('나머지 소식을 한 문장으로');
		expect(prompt).toContain('importance: 이 소식의 중요도 1~5');
		expect(WRITER_SCHEMA.properties.stories.items.required).toContain('importance');
	});

	it('중요도는 1~5 정수로, 빠지면 3', () => {
		expect([importanceOf(5), importanceOf(9), importanceOf(0), importanceOf(4.4), importanceOf(undefined)]).toEqual([
			5, 5, 1, 4, 3,
		]);
	});

	it('사진 목록: 중요한 소식 사진부터(같으면 실린 순), 그 뒤 쓴 기사의 나머지 사진 (겹치면 한 번)', () => {
		const stories = [
			story('아침 속보', 2, 'a.jpg'),
			story('제목 소식', 5, 'b.jpg'),
			story('사진 없음', 4),
			story('셋째', 2, 'c.jpg'),
		];
		expect(coverImages(stories, ['x.jpg', 'b.jpg', ''])).toEqual(['b.jpg', 'a.jpg', 'c.jpg', 'x.jpg']);
	});

	it('본문 HTML에 소식 중요도를 남긴다 (상세 화면 대표 사진 모자이크가 이 순서로)', () => {
		const html = renderNewsletterHtml(
			{ briefing: '', stories: [story('제목 소식', 5, 'b.jpg'), story('예전 소식')], watch: [] },
			[{ source: '연합뉴스', link: 'https://n.news/1' }],
		);
		expect(html).toContain('<article class="story story-analysis" data-importance="5">');
		expect(html).toContain('<article class="story story-analysis">');
	});
});
