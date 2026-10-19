import { NextRequest, NextResponse } from 'next/server';
import { BACK_URL, PROTECTED } from '@/constants/api';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

/**
 * 페이지를 렌더링하기 전에 인증 상태를 맞춥니다.
 * 1. access token 쿠키가 만료돼 없고 refresh token이 있으면 백엔드에서 새 토큰을 받아
 *    브라우저에 쿠키를 내려주고, 이번 요청에도 바로 반영합니다. (서버 컴포넌트는 쿠키를 쓸 수 없으므로 여기서 처리)
 * 2. 로그인이 필요한 경로인데 토큰이 없으면 홈으로 보냅니다.
 */
export async function middleware(request: NextRequest) {
	const hasAccess = request.cookies.has(ACCESS_COOKIE);
	const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

	let response: NextResponse | null = null;
	let authenticated = hasAccess;

	if (!hasAccess && refreshToken) {
		response = await refreshSession(request, refreshToken);
		authenticated = response !== null;
	}

	const { pathname } = request.nextUrl;
	const isProtected = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
	if (isProtected && !authenticated) {
		const url = request.nextUrl.clone();
		url.pathname = '/';
		url.search = '?login=required';
		return NextResponse.redirect(url);
	}

	return response ?? NextResponse.next();
}

async function refreshSession(request: NextRequest, refreshToken: string): Promise<NextResponse | null> {
	try {
		const result = await fetch(`${BACK_URL}/auth/refresh`, {
			headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
			cache: 'no-store',
		});
		if (!result.ok) return null;

		const setCookies = result.headers.getSetCookie();
		const accessToken = setCookies
			.map((cookie) => cookie.match(new RegExp(`^${ACCESS_COOKIE}=([^;]+)`))?.[1])
			.find(Boolean);
		if (!accessToken) return null;

		// 이번 요청을 처리하는 서버 컴포넌트도 새 토큰을 보도록 요청 쿠키를 바꿉니다.
		request.cookies.set(ACCESS_COOKIE, accessToken);
		const response = NextResponse.next({ request: { headers: request.headers } });
		setCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
		return response;
	} catch {
		return null;
	}
}

export const config = {
	// API 프록시(/api), Next 내부 파일, 정적 파일은 제외
	matcher: ['/((?!api|_next/static|_next/image|favicon|icons|img|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|js|css)$).*)'],
};
