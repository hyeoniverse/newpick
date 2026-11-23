import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BreakingBanner from './BreakingBanner';

vi.mock('@/components/common/Image', () => ({
	default: ({ src }: { src: string }) => <span data-src={src} data-testid="breaking-image" />,
}));
const latest = vi.fn();
vi.mock('@/api/edition', () => ({ fetchBreakingLatest: () => latest() }));
afterEach(() => {
	cleanup();
	latest.mockReset();
});
const show = () =>
	render(
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
			<BreakingBanner />
		</QueryClientProvider>,
	);
const notice = (image: string | null) => ({
	id: 5,
	headline: '대통령, 비상계엄 선포',
	reason: '헌정 질서에 바로 영향',
	articles: [{ title: '[속보] 비상계엄 선포', link: 'https://news.test/1', source: '연합뉴스' }],
	detectedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
	image,
});

describe('홈 속보', () => {
	it('나간 속보가 없으면 그리지 않는다', async () => {
		latest.mockResolvedValue(null);
		const { container } = show();
		await new Promise((r) => setTimeout(r, 20));
		expect(container.innerHTML).toBe('');
	});

	it('맨 위 큰 칸: 사진 · 속보 · 몇 분 전 · 큰 제목 · 이유 · 관련 기사', async () => {
		latest.mockResolvedValue(notice('https://img.test/1.jpg'));
		show();
		expect(await screen.findByRole('heading', { level: 2, name: '대통령, 비상계엄 선포' })).toBeTruthy();
		const hero = screen.getByRole('region', { name: '속보' });
		expect(hero.textContent).toContain('12분 전');
		expect(hero.textContent).toContain('헌정 질서에 바로 영향');
		expect(screen.getByTestId('breaking-image').getAttribute('data-src')).toBe('https://img.test/1.jpg');
		expect(hero.querySelector('a[href="https://news.test/1"]')).toBeTruthy();
	});

	it('사진이 없으면 글만, 큰 칸이 화면에 있는 동안 얇은 띠는 숨어 있고 띠는 아코디언으로 펼쳐진다', async () => {
		latest.mockResolvedValue(notice(null));
		show();
		await screen.findByRole('heading', { level: 2, name: '대통령, 비상계엄 선포' });
		expect(screen.queryByTestId('breaking-image')).toBeNull();
		const band = document.querySelector('[data-track-section="home-breaking-band"]')!;
		expect(band.hasAttribute('inert')).toBe(true);
		const toggle = band.querySelector('button')!;
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		fireEvent.click(toggle);
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
	});
});
