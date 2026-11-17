import { isValidElement, type ReactElement } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubscribeFlow } from './useSubscribeFlow';

const openModal = vi.fn();
const closeModal = vi.fn();
const handleSubscribe = vi.fn();
const handleCancel = vi.fn();

vi.mock('@/hooks/useModal', () => ({ useModal: () => ({ openModal, closeModal }) }));
vi.mock('@/hooks/useSubscribe', () => ({
	useSubscribe: () => ({ status: true, isChanging: false, handleSubscribe, handleCancel }),
}));

const done = { title: '완료 제목', body: '완료 본문' };
const input = { interests: ['IT'], isChecked: true };

beforeEach(() => vi.clearAllMocks());

describe('useSubscribeFlow', () => {
	it('구독이 되면 완료 창(문구는 넘긴 것)을 띄우고 true', async () => {
		handleSubscribe.mockResolvedValue(true);
		const { result } = renderHook(() => useSubscribeFlow(done));
		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.subscribe(input);
		});

		expect(ok).toBe(true);
		expect(handleSubscribe).toHaveBeenCalledWith(input);
		expect(openModal).toHaveBeenCalledTimes(1);
		const modal = openModal.mock.calls[0][0] as ReactElement<{ title: string; content: string }>;
		expect(isValidElement(modal)).toBe(true);
		expect(modal.props.title).toBe(done.title);
		expect(modal.props.content).toBe(done.body);
	});

	it('구독이 안 되면 창 없이 false', async () => {
		handleSubscribe.mockResolvedValue(false);
		const { result } = renderHook(() => useSubscribeFlow(done));
		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.subscribe(input);
		});

		expect(ok).toBe(false);
		expect(openModal).not.toHaveBeenCalled();
	});

	it('useSubscribe의 상태 · 해지도 그대로 돌려준다', () => {
		const { result } = renderHook(() => useSubscribeFlow(done));
		expect(result.current.status).toBe(true);
		expect(result.current.handleCancel).toBe(handleCancel);
	});
});
