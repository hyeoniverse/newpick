import { describe, expect, it } from 'vitest';
import { linkDebateSources } from '@/utils/debateSources';

const story = (debate: string, credit: string) =>
	`<article class="story story-analysis"><h2>집값</h2><div class="debate"><h3>엇갈린 주장</h3><ul>${debate}</ul></div>${credit}</article>`;
const claim = (side: string, text: string, source: string) =>
	`<li><strong class="side">${side}</strong><span class="claim">${text}</span><span class="source">${source}</span></li>`;
const credit = (...links: [string, string][]) =>
	`<p class="credit">출처 ${links.map(([name, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).join(' · ')}</p>`;

describe('엇갈린 주장 출처 링크', () => {
	it('같은 소식의 출처 줄에서 언론사 이름이 같은 원문 링크로', () => {
		const html = story(
			claim('이재명 대통령', '서울 전체 폭락이라 한 적 없다.', '아시아경제') +
				claim('장동혁 국민의힘 대표', '강남 3구도 떨어지지 않았다.', '시사저널'),
			credit(['아시아경제', 'https://n.news/a'], ['시사저널', 'https://n.news/b']),
		);
		const out = linkDebateSources(html);
		expect(out).toContain(
			'<a class="source" href="https://n.news/a" target="_blank" rel="noopener noreferrer">아시아경제</a>',
		);
		expect(out).toContain(
			'<a class="source" href="https://n.news/b" target="_blank" rel="noopener noreferrer">시사저널</a>',
		);
	});

	it('출처 줄에 없는 언론사는 글자 그대로, 다른 소식의 링크는 쓰지 않는다', () => {
		const first = story(claim('A', '주장', '한겨레'), credit(['조선일보', 'https://n.news/c']));
		const second = `<article class="story"><p class="credit">출처 <a href="https://n.news/h">한겨레</a></p></article>`;
		const out = linkDebateSources(first + second);
		expect(out).toContain('<span class="source">한겨레</span>');
		expect(out.match(/class="source"/g)).toHaveLength(1);
	});

	it('엇갈린 주장이 없으면 그대로', () => {
		const html = '<article class="story"><p class="credit">출처 <a href="https://n.news/a">한경</a></p></article>';
		expect(linkDebateSources(html)).toBe(html);
	});
});
