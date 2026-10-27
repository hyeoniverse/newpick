import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '@/api/client';
import { API_ENDPOINTS } from '@/constants/api';

const REFRESH = API_ENDPOINTS.AUTH.REFRESH();

const json = (status: number, body?: unknown) =>
	new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});

/** URL마다 정해 둔 응답을 차례로 돌려주는 fetch. 호출 기록은 fetchMock.mock.calls에 남습니다. */
function mockFetch(routes: Record<string, Array<() => Response>>) {
	const fetchMock = vi.fn<(url: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async (url) => {
		const queue = routes[String(url)];
		if (!queue?.length) throw new Error(`예상하지 못한 요청: ${String(url)}`);
		return queue.shift()!();
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

const callsTo = (fetchMock: ReturnType<typeof mockFetch>, url: string) =>
	fetchMock.mock.calls.filter(([called]) => String(called) === url).length;

beforeEach(() => {
	vi.unstubAllGlobals();
});

describe('apiFetch', () => {
	it('브라우저에서는 /api 프록시로 요청한다', () => {
		expect(API_ENDPOINTS.MY.PROFILE()).toBe('/api/mypage/profile');
	});

	it('API 오류 응답의 status · code · message를 ApiError에 담는다', async () => {
		mockFetch({
			'/api/newsletters/6': [
				() =>
					json(404, {
						statusCode: 404,
						code: 'NEWSLETTER_NOT_FOUND',
						message: '뉴스레터를 찾을 수 없습니다.',
						path: '/newsletters/6',
						timestamp: '2026-10-27T00:00:00.000Z',
					}),
			],
		});

		await expect(apiFetch('/api/newsletters/6')).rejects.toMatchObject({
			status: 404,
			code: 'NEWSLETTER_NOT_FOUND',
			message: '뉴스레터를 찾을 수 없습니다.',
		});
	});

	it('JSON이 아닌 오류 응답(프록시 등)은 code 없이 상태 문구로', async () => {
		mockFetch({ '/api/x': [() => new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' })] });

		const error = await apiFetch('/api/x').catch((e: unknown) => e);
		expect(error).toBeInstanceOf(ApiError);
		const apiError = error as ApiError;
		expect(apiError.status).toBe(502);
		expect(apiError.code).toBeUndefined();
		expect(apiError.message).toBe('Bad Gateway');
	});

	it('객체 body는 JSON으로 보내고, 응답 JSON을 돌려준다', async () => {
		const fetchMock = mockFetch({ '/api/category': [() => json(200, { data: [1] })] });

		const result = await apiFetch('/api/category', { method: 'POST', body: { a: 1 } });

		expect(result).toEqual({ data: [1] });
		const [, init = {}] = fetchMock.mock.calls[0];
		expect(init.body).toBe('{"a":1}');
		expect(new Headers(init.headers).get('content-type')).toBe('application/json');
		expect(init.credentials).toBe('include');
	});

	it('204는 undefined', async () => {
		mockFetch({ '/api/x': [() => new Response(null, { status: 204 })] });
		await expect(apiFetch('/api/x')).resolves.toBeUndefined();
	});

	it('실패 응답은 status와 메시지를 가진 ApiError (검증 메시지 배열은 이어 붙인다)', async () => {
		mockFetch({ '/api/x': [() => json(400, { message: ['dateStart must be a date', 'categoryId must be an int'] })] });

		const error = (await apiFetch('/api/x').catch((e) => e)) as ApiError;

		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(400);
		expect(error.message).toBe('dateStart must be a date, categoryId must be an int');
	});

	it('401이면 refresh를 한 번 보내고 원래 요청을 다시 보낸다', async () => {
		const fetchMock = mockFetch({
			'/api/mypage/profile': [() => json(401), () => json(200, { id: 1 })],
			[REFRESH]: [() => json(200, { message: 'Token refreshed' })],
		});

		await expect(apiFetch('/api/mypage/profile')).resolves.toEqual({ id: 1 });
		expect(callsTo(fetchMock, REFRESH)).toBe(1);
		expect(callsTo(fetchMock, '/api/mypage/profile')).toBe(2);
	});

	it('동시에 여러 요청이 401이어도 refresh는 한 번만 보낸다', async () => {
		const fetchMock = mockFetch({
			'/api/a': [() => json(401), () => json(200, 'a')],
			'/api/b': [() => json(401), () => json(200, 'b')],
			'/api/c': [() => json(401), () => json(200, 'c')],
			[REFRESH]: [() => json(200)],
		});

		await expect(Promise.all([apiFetch('/api/a'), apiFetch('/api/b'), apiFetch('/api/c')])).resolves.toEqual([
			'a',
			'b',
			'c',
		]);
		expect(callsTo(fetchMock, REFRESH)).toBe(1);
	});

	it('refresh도 실패하면 다시 보내지 않고 401을 그대로 돌려준다', async () => {
		const fetchMock = mockFetch({
			'/api/mypage/profile': [() => json(401, { message: 'Unauthorized' })],
			[REFRESH]: [() => json(401)],
		});

		const error = (await apiFetch('/api/mypage/profile').catch((e) => e)) as ApiError;

		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(401);
		expect(callsTo(fetchMock, '/api/mypage/profile')).toBe(1);
	});

	it('retryOnUnauthorized: false면 refresh하지 않는다 (로그아웃 등)', async () => {
		const fetchMock = mockFetch({ '/api/auth/logout': [() => json(401)] });

		await expect(apiFetch('/api/auth/logout', { retryOnUnauthorized: false })).rejects.toBeInstanceOf(ApiError);
		expect(callsTo(fetchMock, REFRESH)).toBe(0);
	});

	it('refresh 요청 자신이 401이면 다시 refresh하지 않는다 (무한 반복 방지)', async () => {
		const fetchMock = mockFetch({ [REFRESH]: [() => json(401)] });

		await expect(apiFetch(REFRESH)).rejects.toBeInstanceOf(ApiError);
		expect(callsTo(fetchMock, REFRESH)).toBe(1);
	});
});
