import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '@/stores/useToastStore';
import ToastContainer from './ToastContainer';

beforeEach(() => useToastStore.setState({ toasts: [] }));
afterEach(cleanup);

const container = () => document.querySelector<HTMLElement>('[popover]')!;

describe('ToastContainer (#313)', () => {
	it('토스트가 있을 때만 top layer에 올리고, 새 토스트마다 맨 위로 다시 올린다 (먼저 떠 있던 것 위에 열린 시트보다 위로)', async () => {
		render(<ToastContainer />);
		await act(async () => {});
		expect(container().matches(':popover-open')).toBe(false);

		const show = vi.spyOn(container(), 'showPopover');
		act(() => useToastStore.getState().addToast('저장했습니다.', 'success'));
		expect(screen.getByText('저장했습니다.')).toBeTruthy();
		expect(container().matches(':popover-open')).toBe(true);

		act(() => useToastStore.getState().addToast('한 번 더', 'info'));
		expect(show).toHaveBeenCalledTimes(2);

		act(() => useToastStore.setState({ toasts: [] }));
		expect(container().matches(':popover-open')).toBe(false);
	});
});
