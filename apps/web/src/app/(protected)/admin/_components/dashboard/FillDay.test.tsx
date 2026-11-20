import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FillDay from './FillDay';

const fetchNewsletterList = vi.fn();
vi.mock('@/api/admin', () => ({ fetchNewsletterList: (query: string) => fetchNewsletterList(query) }));

afterEach(cleanup);

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
	it('날짜는 공통 날짜 고르기, 그날 빠진 관심사는 처음부터 골라 두고 이미 있는 뉴스레터는 골라서 다시 쓴다', async () => {
		fetchNewsletterList.mockResolvedValue({
			items: [{ id: 41, categoryId: 2, title: '정치 소식', viewcount: 0, createdAt: '' }],
			total: 1,
		});
		const onConfirm = await renderFill();
		expect(document.querySelector('.np-date-picker')).toBeTruthy();
		expect(document.querySelector('input[type="date"]')).toBeNull();

		const itBox = (await screen.findByLabelText('IT')) as HTMLInputElement;
		const politics = screen.getByLabelText('정치 · 정치 소식') as HTMLInputElement;
		expect(itBox.checked).toBe(true);
		expect(politics.checked).toBe(false);

		fireEvent.click(politics);
		fireEvent.click(screen.getByLabelText('세계'));
		fireEvent.click(screen.getByRole('button', { name: '5편 실행' }));
		expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ categoryIds: [1, 3, 4, 5], newsletterIds: [41] }));
	});

	it('아무것도 고르지 않으면 실행할 수 없다', async () => {
		fetchNewsletterList.mockResolvedValue({
			items: [1, 2, 3, 4, 5, 6].map((categoryId) => ({
				id: categoryId * 10,
				categoryId,
				title: `글${categoryId}`,
				viewcount: 0,
				createdAt: '',
			})),
			total: 6,
		});
		await renderFill();
		expect(await screen.findByText('그날 빠진 관심사가 없습니다.')).toBeTruthy();
		expect((screen.getByRole('button', { name: '실행' }) as HTMLButtonElement).disabled).toBe(true);
	});
});
