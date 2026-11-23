import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
vi.mock('@/hooks/useTrends', () => ({
	useTrends: () => ({
		isLoading: false,
		trends: [summary(1, 'IT', '2026-11-24'), summary(2, '정치', '2026-11-24'), summary(3, '경제', '2026-11-22')],
	}),
}));

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
	vi.setSystemTime(new Date('2026-11-24T03:00:00Z')); // 12:00 KST
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe('오늘의 뉴스레터', () => {
	it('분야마다 오늘 발행된 한 편, 아직 없는 분야(며칠 전 것뿐인 분야 포함)는 준비 중 자리', async () => {
		render(<TrendSection />);
		expect(screen.getByRole('heading', { name: '오늘의 뉴스레터' })).toBeTruthy();
		expect(screen.getByText('11월 24일')).toBeTruthy();
		expect(await screen.findByText('IT 뉴스레터')).toBeTruthy();
		expect(screen.getByText('정치 뉴스레터')).toBeTruthy();
		// 경제는 11월 22일 것이라 오늘 자리에 넣지 않는다
		expect(screen.queryByText('경제 뉴스레터')).toBeNull();
		expect(screen.getAllByText('아직 준비 중이에요')).toHaveLength(4);
	});
});
