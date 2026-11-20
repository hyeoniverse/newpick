import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { kstDate } from '@/utils/formatter';
import FillDay from './FillDay';

const fetchNewsletterList = vi.fn();
vi.mock('@/api/admin', () => ({ fetchNewsletterList: (query: string) => fetchNewsletterList(query) }));

afterEach(cleanup);

const at = (date: string) => `${date}T09:00:00+09:00`;
const item = (id: number, categoryId: number, date: string) => ({
	id,
	categoryId,
	title: `글${id}`,
	viewcount: 0,
	createdAt: at(date),
});

const renderFill = async (onConfirm = vi.fn()) => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	render(
		<QueryClientProvider client={client}>
			<FillDay onCancel={vi.fn()} onConfirm={onConfirm} />
		</QueryClientProvider>,
	);
	await act(async () => {});
	return onConfirm;
};

describe('빠진 날 채우기 · 다시 쓰기', () => {
	it('빠진 날을 먼저 자동으로 늘어놓고, 날짜를 고르면 빠진 관심사는 체크 · 있는 뉴스레터는 골라 다시 쓴다', async () => {
		const yesterday = kstDate(1);
		const twoDaysAgo = kstDate(2);
		// 그저께는 6개 다, 어제는 정치(2)만 있음 → 빠진 날은 어제 하나 (그저께보다 앞은 서비스 전이라 뺌)
		const all = [
			...[1, 2, 3, 4, 5, 6].map((categoryId) => item(100 + categoryId, categoryId, twoDaysAgo)),
			item(41, 2, yesterday),
		];
		fetchNewsletterList.mockImplementation(async (query: string) => {
			const params = new URLSearchParams(query);
			const [from, to] = [params.get('from')!, params.get('to')!];
			const items = all.filter((i) => i.createdAt.slice(0, 10) >= from && i.createdAt.slice(0, 10) <= to);
			return { items, total: items.length };
		});
		const onConfirm = await renderFill();

		const day = await screen.findByRole('button', { name: /5개 빠짐/ });
		expect(screen.getAllByRole('button', { name: /개 빠짐/ })).toHaveLength(1);
		expect(document.querySelector('.np-date-picker')).toBeTruthy();
		expect(document.querySelector('input[type="date"]')).toBeNull();
		expect((screen.getByRole('button', { name: '실행' }) as HTMLButtonElement).disabled).toBe(true);

		fireEvent.click(day);
		const itBox = (await screen.findByLabelText('IT')) as HTMLInputElement;
		const politics = screen.getByLabelText('정치 · 글41') as HTMLInputElement;
		expect(itBox.checked).toBe(true);
		expect(politics.checked).toBe(false);

		fireEvent.click(politics);
		fireEvent.click(screen.getByLabelText('세계'));
		fireEvent.click(screen.getByRole('button', { name: '5편 실행' }));
		expect(onConfirm).toHaveBeenCalledWith({ date: yesterday, categoryIds: [1, 3, 4, 5], newsletterIds: [41] });
	});

	it('빠진 날이 없으면 알리고, 다른 날짜를 달력으로 고를 수 있다', async () => {
		fetchNewsletterList.mockResolvedValue({ items: [], total: 0 });
		await renderFill();
		expect(await screen.findByText(/빠진 날이 없습니다/)).toBeTruthy();
		expect(screen.getByLabelText('다른 날짜 (다시 쓰기)')).toBeTruthy();
	});
});
