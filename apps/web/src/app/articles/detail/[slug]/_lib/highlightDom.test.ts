import { beforeEach, describe, expect, it } from 'vitest';
import { bandsOf, onPage, rangeOf, sameBands, sectionOf, type Band } from './highlightDom';

let root: HTMLElement;
beforeEach(() => {
	document.body.innerHTML = `
		<article id="root">
			<section class="briefing"><p>오늘의 브리핑 문장입니다.</p></section>
			<section class="story"><p>같은 문장이 여기 있다.</p></section>
			<section class="story"><p>둘째 소식의 문장. 같은 문장이 여기 있다.</p></section>
		</article>
		<p id="outside">본문 밖</p>`;
	root = document.getElementById('root')!;
});

describe('sectionOf', () => {
	it('브리핑 · 소식 N(1부터) · 본문 밖은 없음', () => {
		const [briefing, story1, story2] = root.querySelectorAll('p');
		expect(sectionOf(root, briefing.firstChild)).toBe('briefing');
		expect(sectionOf(root, story1.firstChild)).toBe('story-1');
		expect(sectionOf(root, story2)).toBe('story-2');
		expect(sectionOf(root, document.getElementById('outside')!.firstChild)).toBeUndefined();
	});
});

describe('rangeOf', () => {
	it('저장한 구역 안에서 먼저 찾는다 (같은 문장이 앞 구역에도 있어도)', () => {
		const range = rangeOf(root, { section: 'story-2', text: '같은 문장이 여기 있다.' })!;
		expect(range.toString()).toBe('같은 문장이 여기 있다.');
		expect(sectionOf(root, range.startContainer)).toBe('story-2');
	});

	it('구역에 없거나 구역을 모르면 본문 전체에서', () => {
		expect(rangeOf(root, { section: 'story-1', text: '오늘의 브리핑' })?.toString()).toBe('오늘의 브리핑');
		expect(rangeOf(root, { section: null, text: '둘째 소식' })?.toString()).toBe('둘째 소식');
		expect(rangeOf(root, { section: null, text: '없는 문장' })).toBeNull();
	});
});

describe('bandsOf · sameBands', () => {
	it('줄 상자마다 띠 하나: 띠 층 기준 위치, 위 12%를 비우고 높이 78%, 아주 작은 상자는 뺀다', () => {
		const bands = bandsOf(
			{ id: 7, note: '메모' },
			[
				{ left: 110, top: 220, width: 300, height: 20 },
				{ left: 100, top: 244, width: 0.5, height: 20 },
			],
			{ left: 100, top: 200 },
		);
		expect(bands).toHaveLength(1);
		expect(bands[0]).toMatchObject({ id: 7, note: true, left: 10, width: 300 });
		expect(bands[0].top).toBeCloseTo(22.4);
		expect(bands[0].height).toBeCloseTo(15.6);
	});

	it('0.5px 안의 차이는 같은 띠로 본다 (다시 그리지 않게)', () => {
		const a: Band[] = [{ id: 1, note: false, left: 10, top: 20, width: 100, height: 15 }];
		expect(sameBands(a, [{ ...a[0], left: 10.3 }])).toBe(true);
		expect(sameBands(a, [{ ...a[0], left: 10.6 }])).toBe(false);
		expect(sameBands(a, [{ ...a[0], note: true }])).toBe(false);
		expect(sameBands(a, [])).toBe(false);
	});
});

describe('onPage', () => {
	it('화면 좌표에 스크롤 위치를 더해 문서 좌표로', () => {
		const rect = { left: 10, top: 20, bottom: 40, width: 50 } as DOMRect;
		expect(onPage(rect, { x: 5, y: 300 })).toEqual({ left: 15, top: 320, bottom: 340, width: 50 });
	});
});
