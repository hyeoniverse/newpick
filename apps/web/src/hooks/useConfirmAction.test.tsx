import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import Modal from '@/components/common/modal/ModalContainer';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useModalStore } from '@/stores/useModalStore';
import { useToastStore } from '@/stores/useToastStore';

beforeAll(() => {
	HTMLElement.prototype.setPointerCapture = () => {};
});
afterEach(cleanup);
beforeEach(() => {
	useModalStore.setState({ isOpen: false, content: null, size: 'small' });
	useToastStore.setState({ toasts: [] });
});

type Options = Parameters<ReturnType<typeof useConfirmAction>>[0];
let confirm: ReturnType<typeof useConfirmAction>;
function Harness() {
	confirm = useConfirmAction();
	return <Modal />;
}
const ask = (options: Partial<Options>) => {
	render(<Harness />);
	act(() =>
		confirm({
			title: '지울까요?',
			confirmLabel: '지우기',
			failure: '지우지 못했어요.',
			run: async () => 1,
			...options,
		}),
	);
};
const toasts = () => useToastStore.getState().toasts.map((t) => [t.type, t.message]);

describe('확인 창 → 실행 → 알림 (#230)', () => {
	it('취소하면 실행하지 않고 창만 닫는다', () => {
		const run = vi.fn();
		ask({ run });
		fireEvent.click(screen.getByRole('button', { name: '취소' }));
		expect(run).not.toHaveBeenCalled();
		expect(useModalStore.getState().isOpen).toBe(false);
	});

	it('확인하면 창을 닫고 실행, 되면 결과로 만든 알림 → onDone', async () => {
		const onDone = vi.fn();
		ask({ run: async () => ({ changed: 3 }), success: (r: { changed: number }) => `${r.changed}편 고침`, onDone });
		fireEvent.click(screen.getByRole('button', { name: '지우기' }));
		expect(useModalStore.getState().isOpen).toBe(false);
		await waitFor(() => expect(onDone).toHaveBeenCalledWith({ changed: 3 }));
		expect(toasts()).toEqual([['success', '3편 고침']]);
	});

	it('success가 없으면 알리지 않는다 (run 안에서 따로 알릴 때)', async () => {
		const onDone = vi.fn();
		ask({ onDone });
		fireEvent.click(screen.getByRole('button', { name: '지우기' }));
		await waitFor(() => expect(onDone).toHaveBeenCalled());
		expect(toasts()).toEqual([]);
	});

	it('안 되면 api 문구, api 문구가 없으면(네트워크 오류 등) failure 문구 · onDone은 부르지 않는다', async () => {
		const onDone = vi.fn();
		ask({ run: () => Promise.reject(new ApiError(403, '권한이 없습니다.')), onDone });
		fireEvent.click(screen.getByRole('button', { name: '지우기' }));
		await waitFor(() => expect(toasts()).toEqual([['error', '권한이 없습니다.']]));
		cleanup();
		useToastStore.setState({ toasts: [] });

		ask({ run: () => Promise.reject(new TypeError('Failed to fetch')), onDone });
		fireEvent.click(screen.getByRole('button', { name: '지우기' }));
		await waitFor(() => expect(toasts()).toEqual([['error', '지우지 못했어요.']]));
		expect(onDone).not.toHaveBeenCalled();
	});
});
