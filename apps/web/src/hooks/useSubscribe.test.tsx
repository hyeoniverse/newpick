import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubscribe } from '@/hooks/useSubscribe';
import { User } from '@/types/user';
import * as subscriptionApi from '@/api/subscription';
import * as interestsApi from '@/api/interests';
import { useAuthStore } from '@/stores/useAuthStore';

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
	useAuthStore.setState({ session: 'in' });
});

describe('useSubscribe: 구독 상태 조회', () => {
	it('로그인하지 않은 방문자는 부르지 않고 null (예전에는 401 → 토큰 갱신 401로 콘솔 오류 둘)', async () => {
		useAuthStore.setState({ session: 'out' });
		const { result } = setup(true);
		await new Promise((r) => setTimeout(r, 20));
		expect(api.fetchSubscription).not.toHaveBeenCalled();
		expect(result.current.status).toBeNull();
	});

	it('로그인했으면 불러온 값', async () => {
		const { result } = setup(true);
		await waitFor(() => expect(result.current.status).toBe(true));
		expect(api.fetchSubscription).toHaveBeenCalled();
	});
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
		expect(errorToasts()).toEqual([['구독 중 오류가 발생했습니다. 다시 시도해 주십시오.', 'error']]);
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
		expect(errorToasts()).toEqual([['관심사 변경 중 오류가 발생했습니다. 다시 시도해 주십시오.', 'error']]);
	});

	it.each([
		['handlePause', 'pauseSubscription', '구독 일시정지 중 오류가 발생했습니다. 다시 시도해 주십시오.'],
		['handleCancel', 'cancelSubscription', '구독 해지 중 오류가 발생했습니다. 다시 시도해 주십시오.'],
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
		['관심사가 없으면', { interests: [], isChecked: true }, '관심사를 한 개 이상 선택해 주십시오.'],
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

describe('useSubscribe: 일시정지 · 관심사 바꾸기', () => {
	it('일시정지를 다시 켜면 관심사를 보내지 않는다 (예전에는 []를 보내 관심사가 모두 지워지고 메일이 오지 않았다)', async () => {
		api.startSubscription.mockResolvedValue(undefined);
		user = { id: 1, isSubscribed: false };
		const { result } = setup(false);
		await waitFor(() => expect(result.current.status).toBe(false));

		await act(async () => {
			await result.current.toggleSubscribe();
		});

		expect(api.startSubscription).toHaveBeenCalledWith(undefined);
	});

	it('구독 중 관심사를 바꾸면 사용자 · 관심사를 다시 받는다 (화면이 예전 선택으로 돌아가지 않게)', async () => {
		api.updateInterests.mockResolvedValue(['IT']);
		user = { id: 1, isSubscribed: true };
		const { result } = setup(true);
		await waitFor(() => expect(result.current.status).toBe(true));
		const before = api.fetchInterests.mock.calls.length;

		let ok: boolean | undefined;
		await act(async () => {
			ok = await result.current.handleSubscribe({ interests: ['IT'], isChecked: false });
		});

		expect(ok).toBe(true);
		expect(api.updateInterests).toHaveBeenCalled();
		expect(refetchUser).toHaveBeenCalled();
		expect(api.fetchInterests.mock.calls.length).toBeGreaterThan(before);
	});
});
