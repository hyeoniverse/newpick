import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATEGORIES } from '@/constants/categories';

const apiFetch = vi.fn();
const fetchSubscription = vi.fn();
const fetchInterests = vi.fn();
vi.mock('@/api/client', () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));
vi.mock('@/api/subscription', () => ({ fetchSubscription: () => fetchSubscription() }));
vi.mock('@/api/interests', () => ({ fetchInterests: () => fetchInterests() }));

const { fetchUser } = await import('@/api/auth');

const PROFILE = { id: 22, username: '테스트', email: 'test@example.com' };

beforeEach(() => {
	apiFetch.mockReset();
	fetchSubscription.mockReset();
	fetchInterests.mockReset();
});

describe('fetchUser', () => {
	// #292: 프로필을 받은 뒤에 나머지를 받아 한 번 더 오가던 것
	it('프로필 · 구독 상태 · 관심 분야를 한꺼번에 요청한다', async () => {
		let resolveProfile: (v: unknown) => void = () => {};
		apiFetch.mockReturnValue(new Promise((r) => (resolveProfile = r)));
		fetchSubscription.mockResolvedValue(true);
		fetchInterests.mockResolvedValue([CATEGORIES[0].name]);

		const pending = fetchUser();
		// 프로필이 오기 전에 세 요청이 모두 나가 있다
		expect(apiFetch).toHaveBeenCalledTimes(1);
		expect(fetchSubscription).toHaveBeenCalledTimes(1);
		expect(fetchInterests).toHaveBeenCalledTimes(1);

		resolveProfile(PROFILE);
		await expect(pending).resolves.toEqual({ ...PROFILE, isSubscribed: true, interests: [CATEGORIES[0].id] });
	});

	it('구독 상태 · 관심 분야를 못 받으면 프로필만', async () => {
		apiFetch.mockResolvedValue(PROFILE);
		fetchSubscription.mockRejectedValue(new Error('500'));
		fetchInterests.mockResolvedValue([]);

		await expect(fetchUser()).resolves.toEqual(PROFILE);
	});

	it('프로필을 못 받으면 오류 (나머지 실패가 처리되지 않은 채 남지 않는다)', async () => {
		apiFetch.mockRejectedValue(new Error('401'));
		fetchSubscription.mockRejectedValue(new Error('401'));
		fetchInterests.mockRejectedValue(new Error('401'));

		await expect(fetchUser()).rejects.toThrow('401');
	});
});
