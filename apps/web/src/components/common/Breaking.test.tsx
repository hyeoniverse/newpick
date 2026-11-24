import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BreakingBand, { BreakingCard } from './Breaking';

vi.mock('@/components/common/Image', () => ({
	default: ({ src }: { src: string }) => <span data-src={src} data-testid="breaking-image" />,
}));
const latest = vi.fn();
vi.mock('@/api/edition', () => ({ fetchBreakingLatest: () => latest() }));
afterEach(() => {
	cleanup();
	latest.mockReset();
	localStorage.clear();
});
const showBand = (closable: boolean) =>
	render(
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
			<BreakingBand closable={closable} />
		</QueryClientProvider>,
	);
const show = () =>
	render(
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
			<BreakingBand />
			<BreakingCard />
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

	it('큰 칸: 사진 · 속보 · 몇 분 전 · 큰 제목 · 이유 · 관련 기사', async () => {
		latest.mockResolvedValue(notice('https://img.test/1.jpg'));
		show();
		expect(await screen.findByRole('heading', { level: 2, name: '대통령, 비상계엄 선포' })).toBeTruthy();
		const hero = screen.getByRole('region', { name: '속보' });
		expect(hero.textContent).toContain('12분 전');
		expect(hero.textContent).toContain('헌정 질서에 바로 영향');
		expect(screen.getByTestId('breaking-image').getAttribute('data-src')).toBe('https://img.test/1.jpg');
		expect(hero.querySelector('a[href="https://news.test/1"]')).toBeTruthy();
	});

	it('사진이 없으면 글만, 띠는 늘 보이고 아코디언으로 펼쳐진다', async () => {
		latest.mockResolvedValue(notice(null));
		show();
		await screen.findByRole('heading', { level: 2, name: '대통령, 비상계엄 선포' });
		expect(screen.queryByTestId('breaking-image')).toBeNull();
		const band = document.querySelector('[data-track-section="home-breaking-band"]')!;
		expect(band.hasAttribute('inert')).toBe(false);
		const toggle = band.querySelector('button')!;
		expect(toggle.textContent).toContain('대통령, 비상계엄 선포');
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(screen.getAllByText('헌정 질서에 바로 영향').some((el) => el.closest('[inert]'))).toBe(true);
		fireEvent.click(toggle);
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getAllByText('헌정 질서에 바로 영향').some((el) => el.closest('[inert]'))).toBe(false);
	});

	it('다른 페이지의 띠는 닫을 수 있고, 닫은 속보는 다시 보이지 않는다 (메인 띠는 닫기가 없고 늘 보인다)', async () => {
		latest.mockResolvedValue(notice(null));
		showBand(true);
		fireEvent.click(await screen.findByRole('button', { name: '속보 닫기' }));
		expect(document.querySelector('[data-track-section="home-breaking-band"]')).toBeNull();
		expect(JSON.parse(localStorage.getItem('np-breaking-dismissed')!)).toEqual([5]);
		cleanup();

		// 다른 페이지로 가도 다시 안 보인다
		showBand(true);
		await new Promise((r) => setTimeout(r, 20));
		expect(document.querySelector('[data-track-section="home-breaking-band"]')).toBeNull();
		cleanup();

		// 메인: 닫았어도 늘 보이고 닫기 단추가 없다
		showBand(false);
		expect(await screen.findByRole('button', { name: /대통령, 비상계엄 선포/ })).toBeTruthy();
		expect(screen.queryByRole('button', { name: '속보 닫기' })).toBeNull();
	});
});
