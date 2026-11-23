import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TrendSection from './TrendSection';

vi.mock('@/components/common/Card', () => ({
	default: ({ data }: { data: { main: { title: string } } }) => <article>{data.main.title}</article>,
}));
vi.mock('@/components/common/icons/BookmarkIcon', () => ({ default: () => null }));
const summary = (id: number, categoryName: string, date: string) => ({
	id,
	categoryName,
	image: '',
	title: `${categoryName} 뉴스레터`,
	summary: '',
	date,
	views: 0,
});
// IT는 오늘(11-24), 정치 · 경제는 어제, 사회는 그제 것이 가장 최근
vi.mock('@/hooks/useTrends', () => ({
	useTrends: () => ({
		isLoading: false,
		refetch: vi.fn(),
		trends: [
			summary(1, 'IT', '2026-11-24'),
			summary(2, '정치', '2026-11-23'),
			summary(3, '경제', '2026-11-23'),
			summary(4, '사회', '2026-11-22'),
		],
	}),
}));
const publishTime = vi.fn();
vi.mock('@/api/article', () => ({ fetchPublishTime: () => publishTime() }));

const show = (kst: string) => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
	vi.setSystemTime(new Date(`${kst}+09:00`));
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	render(
		<QueryClientProvider client={client}>
			<TrendSection />
		</QueryClientProvider>,
	);
};
const titles = () => screen.queryAllByRole('article').map((a) => a.textContent);

afterEach(() => {
	cleanup();
	vi.useRealTimers();
	publishTime.mockReset();
});

describe('오늘의 뉴스레터', () => {
	it('발행 시각(08:30)이 지나면 오늘 것만, 아직 없는 분야는 준비 중 자리', async () => {
		publishTime.mockResolvedValue({ hour: 8, minute: 30 });
		show('2026-11-24T12:00:00');
		expect(await screen.findByText('IT 뉴스레터')).toBeTruthy();
		expect(screen.getByRole('heading', { name: '오늘의 뉴스레터' })).toBeTruthy();
		expect(screen.getByText('11월 24일')).toBeTruthy();
		expect(titles()).toEqual(['IT 뉴스레터']);
		expect(screen.getAllByText('아직 준비 중이에요', { exact: false })).toHaveLength(5);
		// 준비 중 자리에 분야 이름
		expect(screen.getByText('경제').parentElement?.textContent).toBe('경제· 아직 준비 중이에요');
	});

	it('발행 시각 전에는 전날 것을 보이고 날짜도 전날 (일찍 만든 오늘 것은 함께, 그제 것은 준비 중)', async () => {
		publishTime.mockResolvedValue({ hour: 8, minute: 30 });
		show('2026-11-24T07:00:00');
		expect(await screen.findByText('정치 뉴스레터')).toBeTruthy();
		expect(screen.getByText('11월 23일')).toBeTruthy();
		expect([...titles()].sort()).toEqual(['IT 뉴스레터', '경제 뉴스레터', '정치 뉴스레터'].sort());
		expect(screen.queryByText('사회 뉴스레터')).toBeNull();
	});

	it('발행 시각을 받지 못하면 오늘 것만', async () => {
		publishTime.mockRejectedValue(new Error('down'));
		show('2026-11-24T07:00:00');
		// 한 번 더 받아 보고(1초 뒤) 포기한다
		expect(await screen.findByText('IT 뉴스레터', {}, { timeout: 4000 })).toBeTruthy();
		expect(titles()).toEqual(['IT 뉴스레터']);
		expect(screen.getByText('11월 24일')).toBeTruthy();
	});
});
