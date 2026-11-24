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
const minutesFromNow = (m: number) => new Date(Date.now() + m * 60 * 1000).toISOString();
const alert = (id: number, status: string, sendAt: string | null, headline: string) => ({
	id,
	status,
	score: 10,
	headline,
	reason: '헌정 질서에 바로 영향',
	articles: [{ title: `${headline} 기사`, link: `https://news.test/${id}`, source: '연합뉴스' }],
	detectedAt: minutesFromNow(-1),
	sendAt,
	decidedAt: null,
});
const decideBreaking = vi.fn().mockResolvedValue({});
const setBreakingAuto = vi.fn().mockResolvedValue({});
vi.mock('@/api/admin', () => ({
	fetchBreaking: () =>
		Promise.resolve({
			auto: true,
			dailyLimit: 3,
			holdMinutes: 5,
			alerts: [
				alert(4, 'scheduled', minutesFromNow(4), '대통령, 비상계엄 선포'),
				alert(3, 'held', null, '전국 휴교령'),
				alert(2, 'scheduled', minutesFromNow(-10), '이미 나간 속보'),
				alert(1, 'canceled', null, '보내지 않은 후보'),
			],
		}),
	decideBreaking: (...args: unknown[]) => decideBreaking(...args),
	setBreakingAuto: (...args: unknown[]) => setBreakingAuto(...args),
}));
// 확인 창 없이 바로 실행
vi.mock('@/hooks/useConfirmAction', () => ({
	useConfirmAction: () => (options: { run: () => Promise<unknown> }) => options.run(),
}));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
afterEach(cleanup);

describe('관리자 › 속보', () => {
	it('위에는 지금 막을 수 있는 속보(발송 예정 남은 시간 · 보류)와 단추, 아래 표에는 지난 속보, 자동 발송 스위치', async () => {
		render(
			<QueryClientProvider client={new QueryClient()}>
				<BreakingAdmin />
			</QueryClientProvider>,
		);
		expect(await screen.findByText('대통령, 비상계엄 선포')).toBeTruthy();
		expect(screen.getByTestId('summary').textContent).toBe('발송 예정 · 보류 2건');
		// 위 칸: 남은 시간(분:초) · 보류
		const open = screen.getByRole('region', { name: '지금 막을 수 있는 속보' });
		expect(open.textContent).toMatch(/0[34]:\d\d뒤 발송/);
		expect(open.textContent).toContain('보류');
		expect(open.textContent).not.toContain('이미 나간 속보');
		// 아래 표: 지난 속보 (보낼 시각이 지난 발송 예정은 '발행')
		const history = screen.getByRole('region', { name: '지난 속보' });
		const rows = [...history.querySelectorAll('tbody tr')].map((tr) =>
			[...tr.querySelectorAll('td')].slice(1, 4).map((td) => td.textContent),
		);
		expect(rows).toEqual([
			['발행', '10', '이미 나간 속보'],
			['미발행', '10', '보내지 않은 후보'],
		]);

		fireEvent.click(screen.getAllByRole('button', { name: '보내지 않기' })[0]);
		expect(decideBreaking).toHaveBeenCalledWith(4, 'cancel');
		fireEvent.click(screen.getAllByRole('button', { name: '지금 바로 보내기' })[1]);
		expect(decideBreaking).toHaveBeenCalledWith(3, 'send');

		fireEvent.click(screen.getByRole('switch', { name: '자동 발송' }));
		expect(setBreakingAuto).toHaveBeenCalledWith(false);
	});
});
