// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { middleware } from '@/middleware';
import { COOKIES } from '@/constants/storage';

/** 만료돼 access token은 없고 refresh token · 로그인 표시 쿠키만 있는 브라우저의 요청 */
const expiredRequest = (path: string) =>
	new NextRequest(`https://newpick.test${path}`, {
		headers: { cookie: `${COOKIES.refresh}=r1; ${COOKIES.sessionHint}=1` },
	});

const stubRefresh = (respond: () => Response | Promise<Response>) =>
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => respond()),
	);

const clearsHint = (response: Response) =>
	response.headers.getSetCookie().some((c) => c.startsWith(`${COOKIES.sessionHint}=`));

afterEach(() => vi.unstubAllGlobals());

describe('middleware: 토큰 갱신', () => {
	it('refresh token이 끝났으면(401) 보호된 화면은 홈 로그인 안내로', async () => {
		stubRefresh(() => new Response(null, { status: 401 }));
		const response = await middleware(expiredRequest('/mypage'));
		expect(response.headers.get('location')).toContain('/?login=required');
	});

	it.each([
		['5xx', () => new Response(null, { status: 500 })],
		[
			'없음 (네트워크 오류)',
			() => {
				throw new TypeError('fetch failed');
			},
		],
	])('갱신 응답이 %s일 때는 홈으로 보내지 않고 로그인 표시도 지우지 않는다 (#340)', async (_, respond) => {
		stubRefresh(respond);
		const response = await middleware(expiredRequest('/mypage'));
		expect(response.headers.get('location')).toBeNull();
		expect(clearsHint(response)).toBe(false);
	});
});
