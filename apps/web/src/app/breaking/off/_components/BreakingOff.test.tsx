import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BreakingOff from './BreakingOff';

let token = 'tok';
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn() }),
	useSearchParams: () => new URLSearchParams(token ? { token } : {}),
}));
const target = vi.fn();
const turnOff = vi.fn().mockResolvedValue({});
vi.mock('@/api/subscription', () => ({
	fetchBreakingOffTarget: (t: string) => target(t),
	turnOffBreakingByToken: (t: string) => turnOff(t),
}));
afterEach(() => {
	cleanup();
	token = 'tok';
});

const renderOff = () =>
	render(
		<QueryClientProvider client={new QueryClient()}>
			<BreakingOff />
		</QueryClientProvider>,
	);

describe("메일의 '속보만 받지 않기'", () => {
	it('여는 것만으로는 끄지 않고, 받지 않기를 누르면 끈다 (매일 메일은 그대로라고 알린다)', async () => {
		target.mockResolvedValueOnce({ email: 'he***@test.dev', receiving: true });
		renderOff();
		expect(await screen.findByText('속보 메일을 그만 받으시겠습니까?')).toBeTruthy();
		expect(screen.getByText('he***@test.dev')).toBeTruthy();
		expect(screen.getByText('매일 아침 뉴스레터 메일')).toBeTruthy();
		expect(turnOff).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: '받지 않기' }));
		expect(await screen.findByText('속보 메일을 받지 않습니다')).toBeTruthy();
		expect(turnOff).toHaveBeenCalledWith('tok');
	});

	it('이미 껐으면 그렇게 알리고, 토큰이 없거나 틀리면 링크가 올바르지 않다고 한다', async () => {
		target.mockResolvedValueOnce({ email: 'he***@test.dev', receiving: false });
		renderOff();
		expect(await screen.findByText('이미 속보 메일을 받지 않고 있습니다')).toBeTruthy();
		cleanup();
		token = '';
		renderOff();
		expect(screen.getByText('링크가 올바르지 않습니다')).toBeTruthy();
	});
});
