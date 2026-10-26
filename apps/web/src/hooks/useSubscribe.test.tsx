import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubscribe } from '@/hooks/useSubscribe';
import { User } from '@/models/user.model';
import * as subscriptionApi from '@/api/subscription';
import * as interestsApi from '@/api/interests';

const showToast = vi.fn();
const refetchUser = vi.fn().mockResolvedValue(undefined);
let user: Partial<User> | null = null;

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user, refetchUser }) }));
vi.mock('@/api/subscription', () => ({
	fetchSubscription: vi.fn(),
	startSubscription: vi.fn(),
	pauseSubscription: vi.fn(),
	cancelSubscription: vi.fn(),
}));
vi.mock('@/api/interests', () => ({ fetchInterests: vi.fn(), updateInterests: vi.fn() }));

const api = vi.mocked({ ...subscriptionApi, ...interestsApi });
const errorToasts = () => showToast.mock.calls.filter(([, type]) => type === 'error');

function setup(status: boolean | null) {
	api.fetchSubscription.mockResolvedValue(status);
	api.fetchInterests.mockResolvedValue([]);
	const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
	return renderHook(() => useSubscribe(), { wrapper });
}

beforeEach(() => {
	vi.clearAllMocks();
	user = { id: 1, isSubscribed: null };
});

describe('useSubscribe: 실패는 토스트 한 번으로 알리고 false를 돌려준다', () => {
	it('구독 시작 실패 (이전에는 mutation과 handleSubscribe가 각각 띄워 2개)', async () => {
		api.startSubscription.mockRejectedValue(new Error('500'));
		const { result } = setup(null);

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.handleSubscribe({ interests: ['IT'], isChecked: true });
		});

		expect(ok).toBe(false);
		expect(errorToasts()).toEqual([['구독 중 오류가 발생했습니다. 다시 시도해주세요.', 'error']]);
	});

	it('구독 중인 사용자의 관심사 변경 실패 (이전에는 이 경우만 일반 문구)', async () => {
		user = { id: 1, isSubscribed: true };
		api.updateInterests.mockRejectedValue(new Error('500'));
		const { result } = setup(true);

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.handleSubscribe({ interests: ['IT'], isChecked: false });
		});

		expect(ok).toBe(false);
		expect(api.startSubscription).not.toHaveBeenCalled();
		expect(errorToasts()).toEqual([['관심사 변경 중 오류가 발생했습니다. 다시 시도해주세요.', 'error']]);
	});

	it.each([
		['handlePause', 'pauseSubscription', '구독 일시정지 중 오류가 발생했습니다. 다시 시도해주세요.'],
		['handleCancel', 'cancelSubscription', '구독 해지 중 오류가 발생했습니다. 다시 시도해주세요.'],
	] as const)('%s 실패', async (handler, apiName, message) => {
		api[apiName].mockRejectedValue(new Error('500'));
		const { result } = setup(true);

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current[handler]();
		});

		expect(ok).toBe(false);
		expect(errorToasts()).toEqual([[message, 'error']]);
	});
});

describe('useSubscribe: 성공과 입력 검사', () => {
	it('구독 시작 성공: true, 구독 상태와 사용자를 다시 조회', async () => {
		api.startSubscription.mockResolvedValue(undefined);
		const { result } = setup(null);
		await waitFor(() => expect(api.fetchSubscription).toHaveBeenCalledTimes(1));

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.handleSubscribe({ interests: ['IT'], isChecked: true });
		});

		expect(ok).toBe(true);
		expect(api.startSubscription).toHaveBeenCalledWith(['IT']);
		expect(refetchUser).toHaveBeenCalled();
		expect(api.fetchSubscription).toHaveBeenCalledTimes(2);
		expect(errorToasts()).toEqual([]);
	});

	it.each([
		['관심사가 없으면', { interests: [], isChecked: true }, '최소 한 개 이상의 관심사를 선택해야 합니다.'],
		[
			'처음 구독인데 약관에 동의하지 않으면',
			{ interests: ['IT'], isChecked: false },
			'약관에 동의해야 구독할 수 있습니다.',
		],
	])('%s 요청하지 않는다', async (_, input, message) => {
		const { result } = setup(null);

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.handleSubscribe(input);
		});

		expect(ok).toBe(false);
		expect(api.startSubscription).not.toHaveBeenCalled();
		expect(showToast).toHaveBeenCalledWith(message, 'warning');
	});
});
