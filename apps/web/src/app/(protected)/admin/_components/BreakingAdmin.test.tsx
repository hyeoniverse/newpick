import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BreakingAdmin from './BreakingAdmin';

vi.mock('./AdminSubPage', () => ({
	default: ({ title, summary, children }: { title: string; summary?: string; children: React.ReactNode }) => (
		<div>
			<h1>{title}</h1>
			<span data-testid="summary">{summary}</span>
			{children}
		</div>
	),
}));
const decideBreaking = vi.fn().mockResolvedValue({});
vi.mock('@/api/admin', () => ({
	fetchBreaking: () =>
		Promise.resolve([
			{
				id: 2,
				status: 'pending',
				score: 10,
				headline: '대통령, 비상계엄 선포',
				reason: '헌정 질서에 바로 영향',
				articles: [{ title: '대통령 비상계엄 선포', link: 'https://news.test/1', source: '연합뉴스' }],
				detectedAt: '2026-11-24T13:00:00Z',
				decidedAt: null,
			},
			{
				id: 1,
				status: 'rejected',
				score: 9,
				headline: '지난 후보',
				reason: '',
				articles: [],
				detectedAt: '2026-11-23T13:00:00Z',
				decidedAt: '2026-11-23T13:10:00Z',
			},
		]),
	decideBreaking: (...args: unknown[]) => decideBreaking(...args),
}));
// 확인 창 없이 바로 실행
vi.mock('@/hooks/useConfirmAction', () => ({
	useConfirmAction: () => (options: { run: () => Promise<unknown> }) => options.run(),
}));
afterEach(cleanup);

describe('관리자 › 속보', () => {
	it('후보를 새것부터 보이고, 확인 대기인 것만 승인 · 기각할 수 있다', async () => {
		render(
			<QueryClientProvider client={new QueryClient()}>
				<BreakingAdmin />
			</QueryClientProvider>,
		);
		expect(await screen.findByText('대통령, 비상계엄 선포')).toBeTruthy();
		expect(screen.getByTestId('summary').textContent).toBe('확인 대기 1건');
		expect(screen.getByText('10점')).toBeTruthy();
		expect(screen.getByRole('link', { name: '대통령 비상계엄 선포' }).getAttribute('href')).toBe('https://news.test/1');
		// 기각한 후보에는 단추가 없다
		expect(screen.getAllByRole('button', { name: '승인' })).toHaveLength(1);
		fireEvent.click(screen.getByRole('button', { name: '승인' }));
		expect(decideBreaking).toHaveBeenCalledWith(2, 'approve');
		fireEvent.click(screen.getByRole('button', { name: '기각' }));
		expect(decideBreaking).toHaveBeenCalledWith(2, 'reject');
	});
});
