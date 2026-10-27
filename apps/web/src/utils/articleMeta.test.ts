import { describe, expect, it } from 'vitest';
import { articleDescription, categoryName } from '@/utils/articleMeta';

describe('articleDescription (#15)', () => {
	it('부제가 있으면 부제', () => {
		expect(articleDescription({ subtitle: ' 정부가 대응 지침을 냈다. ', content: '본문' })).toBe(
			'정부가 대응 지침을 냈다.',
		);
	});

	it('부제가 없으면 본문에서 마크다운 · HTML을 걷어 낸 앞부분', () => {
		expect(articleDescription({ subtitle: null, content: '## 제목\n\n**코스피**가 <b>5500선</b> 아래로' })).toBe(
			'제목 코스피 가 5500선 아래로',
		);
	});

	it('120자를 넘으면 자르고 말줄임표', () => {
		const result = articleDescription({ subtitle: null, content: '가'.repeat(300) });
		expect(result).toHaveLength(120);
		expect(result.endsWith('…')).toBe(true);
	});
});

describe('categoryName', () => {
	it('id로 관심사 이름을 찾는다', () => {
		expect(categoryName(3)).toBe('경제');
		expect(categoryName(99)).toBeUndefined();
	});
});
