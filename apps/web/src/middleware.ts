import { NextRequest, NextResponse } from 'next/server';
import { BACK_URL, PROTECTED, SESSION_HINT_COOKIE } from '@/constants/api';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

/**
 * 페이지를 렌더링하기 전에 인증 상태를 맞춥니다.
 * 1. access token 쿠키가 만료돼 없고 refresh token이 있으면 백엔드에서 새 토큰을 받아
 *    브라우저에 쿠키를 내려주고, 이번 요청에도 바로 반영합니다. (서버 컴포넌트는 쿠키를 쓸 수 없으므로 여기서 처리)
 * 2. 로그인이 필요한 경로인데 토큰이 없으면 홈으로 보냅니다.
 * 3. 로그인 표시 쿠키를 토큰 상태에 맞춥니다. 갱신에 실패하면 지우고,
 *    토큰은 있는데 표시 쿠키가 없으면(이 쿠키가 생기기 전에 로그인한 경우) 채웁니다.
 */
export async function middleware(request: NextRequest) {
	const hasAccess = request.cookies.has(ACCESS_COOKIE);
	const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

	let response: NextResponse | null = null;
	let authenticated = hasAccess;
	// 갱신 실패 응답의 Set-Cookie (api가 표시 쿠키를 자신의 쿠키 옵션으로 지웁니다)
	let failedSetCookies: string[] = [];

	if (!hasAccess && refreshToken) {
		const result = await refreshSession(request, refreshToken);
		if (result.ok) response = result.response;
		else failedSetCookies = result.setCookies;
		authenticated = result.ok;
	}

	const clearHint = !authenticated && request.cookies.has(SESSION_HINT_COOKIE);

	const { pathname } = request.nextUrl;
	const isProtected = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
	if (isProtected && !authenticated) {
		const url = request.nextUrl.clone();
		url.pathname = '/';
		url.search = '?login=required';
		return withClearedHint(NextResponse.redirect(url), clearHint, failedSetCookies);
	}

	if (hasAccess && !request.cookies.has(SESSION_HINT_COOKIE)) {
		response ??= NextResponse.next();
		response.cookies.set(SESSION_HINT_COOKIE, '1', { path: '/', secure: true, sameSite: 'lax' });
	}

	return response ?? withClearedHint(NextResponse.next(), clearHint, failedSetCookies);
}

function withClearedHint(response: NextResponse, clearHint: boolean, setCookies: string[]) {
	if (!clearHint) return response;
	if (setCookies.some((cookie) => cookie.startsWith(`${SESSION_HINT_COOKIE}=`))) {
		setCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
	} else {
		// api에 닿지 못했거나 refresh token이 아예 없는 경우
		response.cookies.delete(SESSION_HINT_COOKIE);
	}
	return response;
}

type RefreshResult = { ok: true; response: NextResponse } | { ok: false; setCookies: string[] };

async function refreshSession(request: NextRequest, refreshToken: string): Promise<RefreshResult> {
	try {
		const result = await fetch(`${BACK_URL}/auth/refresh`, {
			headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
			cache: 'no-store',
		});
		const setCookies = result.headers.getSetCookie();
		if (!result.ok) return { ok: false, setCookies };

		const accessToken = setCookies
			.map((cookie) => cookie.match(new RegExp(`^${ACCESS_COOKIE}=([^;]+)`))?.[1])
			.find(Boolean);
		if (!accessToken) return { ok: false, setCookies: [] };

		// 이번 요청을 처리하는 서버 컴포넌트도 새 토큰을 보도록 요청 쿠키를 바꿉니다.
		request.cookies.set(ACCESS_COOKIE, accessToken);
		const response = NextResponse.next({ request: { headers: request.headers } });
		setCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
		return { ok: true, response };
	} catch {
		return { ok: false, setCookies: [] };
	}
}

export const config = {
	// API 프록시(/api), Next 내부 파일, 정적 파일은 제외
	matcher: [
		'/((?!api|_next/static|_next/image|favicon|icons|img|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|js|css)$).*)',
	],
};
