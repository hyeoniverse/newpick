import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TitleSection, { coverProgress } from './TitleSection';

vi.mock('@/components/common/Image', () => ({ default: () => null }));
// jsdom에는 없다
vi.stubGlobal(
	'ResizeObserver',
	class {
		observe() {}
		disconnect() {}
	},
);
afterEach(cleanup);

describe('홈 첫 화면 패널', () => {
	it('아래 판이 덮은 정도: 판이 패널 위 끝까지 올라오면 1, 그 사이는 비율, 넘으면 1에서 멈춘다', () => {
		expect(coverProgress(0, 600)).toBe(0);
		expect(coverProgress(150, 600)).toBe(0.25);
		expect(coverProgress(900, 600)).toBe(1);
		expect(coverProgress(-20, 600)).toBe(0);
		expect(coverProgress(100, 0)).toBe(0);
	});

	it("시작 애니메이션: 로고는 글자마다 나뉘어 있고(N · P가 'NP'에서 펼쳐진다), 패널은 제자리에 멈춘다", () => {
		const { container } = render(<TitleSection firstArticles={[]} secondArticles={[]} />);
		const logo = screen.getByRole('img', { name: 'NewPick' });
		expect([...logo.querySelectorAll('[data-letter]')].map((p) => p.getAttribute('data-letter'))).toEqual([
			'k',
			'c',
			'i',
			'P',
			'w',
			'e',
			'N',
		]);
		const panel = container.querySelector('[data-track-section="home-title"]')!;
		expect(panel.className).toContain('np-intro');
		expect(panel.className).toContain('sticky');
	});
});
