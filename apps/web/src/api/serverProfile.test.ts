import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIES } from '@/constants/storage';

const apiFetch = vi.fn();
let cookieValue: string | undefined;
vi.mock('@/api/client', () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }));
vi.mock('next/headers', () => ({
	cookies: async () => ({
		get: (name: string) => (name === COOKIES.access && cookieValue ? { value: cookieValue } : undefined),
	}),
}));

const { fetchProfileOnServer } = await import('@/api/serverProfile');

const PROFILE = { id: 22, username: '뉴픽 독자', email: 'reader@example.com', profileImg: null };

beforeEach(() => {
	apiFetch.mockReset();
	cookieValue = undefined;
});

describe('fetchProfileOnServer (#307)', () => {
	it('로그인 쿠키를 그대로 실어 프로필을 받는다 (캐시하지 않음)', async () => {
		cookieValue = 'token-abc';
		apiFetch.mockResolvedValue(PROFILE);
		await expect(fetchProfileOnServer()).resolves.toEqual(PROFILE);
		const [url, options] = apiFetch.mock.calls[0];
		expect(url).toMatch(/\/mypage\/profile$/);
		expect(options.headers).toEqual({ Cookie: `${COOKIES.access}=token-abc` });
		expect(options.cache).toBe('no-store');
		expect(options.signal).toBeInstanceOf(AbortSignal);
	});

	it('로그인 쿠키가 없으면 api를 부르지 않고 null', async () => {
		await expect(fetchProfileOnServer()).resolves.toBeNull();
		expect(apiFetch).not.toHaveBeenCalled();
	});

	it('거절(401) · 시간 초과 · api 꺼짐이면 null → 브라우저가 받아 그리는 예전 길로', async () => {
		cookieValue = 'expired';
		apiFetch.mockRejectedValueOnce(Object.assign(new Error('로그인이 필요합니다.'), { status: 401 }));
		await expect(fetchProfileOnServer()).resolves.toBeNull();
		apiFetch.mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'));
		await expect(fetchProfileOnServer()).resolves.toBeNull();
		apiFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
		await expect(fetchProfileOnServer()).resolves.toBeNull();
	});
});
