import { createHmac } from 'node:crypto';
import type { BrowserContext } from '@playwright/test';
import { E2E } from './env.mjs';

const base64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

/** api의 JwtStrategy가 받는 것과 같은 HS256 access token ({ sub: userId }) */
export function accessToken(userId: number): string {
	const now = Math.floor(Date.now() / 1000);
	const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const payload = base64url(JSON.stringify({ sub: userId, iat: now, exp: now + 60 * 60 }));
	const signature = createHmac('sha256', E2E.jwtSecret).update(`${header}.${payload}`).digest('base64url');
	return `${header}.${payload}.${signature}`;
}

/**
 * Google OAuth 대신 쓰는 테스트용 로그인. api가 로그인 때 내려주는 쿠키 두 개를 브라우저에 직접 넣는다.
 * (access_token: 인증, logged_in: 첫 화면의 로그인 표시)
 */
export async function logIn(context: BrowserContext, userId: number) {
	await context.addCookies([
		{ name: 'access_token', value: accessToken(userId), url: E2E.webUrl, httpOnly: true },
		{ name: 'logged_in', value: '1', url: E2E.webUrl },
	]);
}

/** 테스트에서 api를 직접 부를 때 붙이는 쿠키 헤더 */
export const authHeaders = (userId: number) => ({ Cookie: `access_token=${accessToken(userId)}` });
