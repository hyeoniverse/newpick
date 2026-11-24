import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BreakingMail from './BreakingMail';

let isSubscribed: boolean | null = true;
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { isSubscribed } }) }));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
const settings = vi.fn();
const save = vi.fn((next) => Promise.resolve({ enabled: true, night: false, ...next }));
vi.mock('@/api/subscription', () => ({
	fetchBreakingMail: () => settings(),
	saveBreakingMail: (next: unknown) => save(next),
}));
afterEach(() => {
	cleanup();
	isSubscribed = true;
});

const renderIt = () =>
	render(
		<QueryClientProvider client={new QueryClient()}>
			<BreakingMail />
		</QueryClientProvider>,
	);

describe('마이페이지 › 설정 › 속보 메일', () => {
	it('받기 · 밤에도 바로 받기 스위치: 누르면 그것만 저장한다', async () => {
		settings.mockResolvedValue({ enabled: true, night: false });
		renderIt();
		const night = screen.getByRole('switch', { name: '밤에도 바로 받기' });
		await waitFor(() => expect((night as HTMLButtonElement).disabled).toBe(false));
		fireEvent.click(night);
		await waitFor(() => expect(save).toHaveBeenCalledWith({ night: true }));
		fireEvent.click(screen.getByRole('switch', { name: '속보 메일' }));
		await waitFor(() => expect(save).toHaveBeenLastCalledWith({ enabled: false }));
	});

	it('받기가 꺼져 있으면 밤 설정은 쓸 수 없고, 구독 기록이 없으면 보이지 않는다', async () => {
		settings.mockResolvedValue({ enabled: false, night: false });
		renderIt();
		await waitFor(() => expect(screen.getAllByText('꺼짐').length).toBe(2));
		expect((screen.getByRole('switch', { name: '밤에도 바로 받기' }) as HTMLButtonElement).disabled).toBe(true);
		cleanup();
		isSubscribed = null;
		const { container } = renderIt();
		expect(container.textContent).toBe('');
	});
});
