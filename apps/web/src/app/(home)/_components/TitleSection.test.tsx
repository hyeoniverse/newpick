import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TitleSection, { stickyTop } from './TitleSection';

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
	it('패널이 화면보다 길면 아래 끝이 화면 아래에 닿을 때 멈추고, 짧으면 맨 위에서 멈춘다', () => {
		expect(stickyTop(800, 1000)).toBe(-200);
		expect(stickyTop(900, 700)).toBe(0);
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
