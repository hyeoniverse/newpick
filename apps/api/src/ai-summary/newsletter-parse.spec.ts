import { parseNewsletterHtml } from './newsletter-parse';

const html = (heading: string) =>
	`<div class="newsletter"><article class="story"><h2>${heading}</h2><p class="lead">한 줄</p></article></div>`;

describe('parseNewsletterHtml: 읽은 결과 기억', () => {
	it('같은 본문은 같은 결과 (두 번째는 기억해 둔 것)', () => {
		const first = parseNewsletterHtml(html('금리 동결'));
		const second = parseNewsletterHtml(html('금리 동결'));
		expect(second).toEqual(first);
		expect(second.stories[0].heading).toBe('금리 동결');
	});

	it('받은 결과를 고쳐도 다음에 읽을 때는 그대로 (복사본을 준다)', () => {
		const first = parseNewsletterHtml(html('반도체 수출'));
		first.stories[0].heading = '바뀐 제목';
		first.stories.push({ ...first.stories[0] });
		const again = parseNewsletterHtml(html('반도체 수출'));
		expect(again.stories).toHaveLength(1);
		expect(again.stories[0].heading).toBe('반도체 수출');
	});

	it('본문이 바뀌면(다시 만든 뉴스레터) 새로 읽는다', () => {
		expect(parseNewsletterHtml(html('처음 제목')).stories[0].heading).toBe('처음 제목');
		expect(parseNewsletterHtml(html('다시 만든 제목')).stories[0].heading).toBe('다시 만든 제목');
	});

	it('본문이 없으면 빈 결과', () => {
		expect(parseNewsletterHtml(null)).toEqual({ briefing: '', stories: [], watch: [], morning: [] });
	});
});

describe('parseNewsletterHtml: 소식 중요도 (#360 data-importance)', () => {
	it('있으면 숫자로, 없으면(예전 뉴스레터) 빈 칸', () => {
		const { stories } = parseNewsletterHtml(
			'<div class="newsletter"><article class="story story-analysis" data-importance="5"><h2>새 소식</h2></article><article class="story story-analysis"><h2>예전 소식</h2></article></div>',
		);
		expect(stories.map((s) => [s.heading, s.importance])).toEqual([
			['새 소식', 5],
			['예전 소식', undefined],
		]);
	});
});
