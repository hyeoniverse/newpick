import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { authCookieOptions } from './cookie-options';

/** Google 로그인 state를 담는 쿠키 (구글로 보낼 때 만들고, 돌아오면 비교하고 지운다) */
export const OAUTH_STATE_COOKIE = 'oauth_state';
/** 구글 화면에서 머무를 수 있는 시간 */
export const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;

type Callback = (error: Error | null, ok?: string | boolean, info?: { message: string }) => void;

/**
 * Google 로그인의 state (로그인 CSRF 막기). 세션 저장소가 없는 서비스라 state를 이 브라우저의 httpOnly 쿠키에 둔다.
 * - 보낼 때: 무작위 32바이트를 쿠키에 담고 같은 값을 구글로 보내는 주소의 state에 싣는다
 * - 돌아올 때: 주소의 state와 쿠키가 같아야 통과 (비교는 timingSafeEqual). 맞든 틀리든 쿠키는 지운다
 * 그러면 공격자가 자기 계정으로 받은 콜백 주소를 피해자에게 열게 해도, 피해자 브라우저에는 그 state 쿠키가 없어 거절된다.
 * 로그인 요청 · 콜백 모두 웹의 /api 프록시(같은 사이트)를 거치고 구글에서 돌아오는 것은 최상위 GET이라 SameSite=Lax 쿠키가 실린다
 */
export class CookieStateStore {
	/** passport-oauth2가 인자 개수(3)로 부르는 방식을 고른다 */
	store(req: Request, _meta: unknown, callback: Callback) {
		const state = randomBytes(32).toString('base64url');
		req.res?.cookie(OAUTH_STATE_COOKIE, state, authCookieOptions(OAUTH_STATE_MAX_AGE));
		callback(null, state);
	}

	verify(req: Request, provided: unknown, callback: Callback) {
		const expected: unknown = req.cookies?.[OAUTH_STATE_COOKIE];
		req.res?.clearCookie(OAUTH_STATE_COOKIE, authCookieOptions());
		if (!sameState(expected, provided)) {
			return callback(null, false, { message: '로그인 요청을 확인할 수 없습니다 (state 불일치).' });
		}
		// 확인되면 true. 문자열을 돌려주면 passport-oauth2가 PKCE의 code_verifier로 보고 구글에 함께 보내,
		// 구글이 'code_verifier or verifier is not needed'로 로그인을 거절한다 (실제 로그인에서 찾은 버그)
		callback(null, true);
	}
}

/** 둘 다 같은 길이의 문자열이고 내용이 같은가 (길이가 다르면 timingSafeEqual이 던지므로 먼저 본다) */
export function sameState(expected: unknown, provided: unknown): boolean {
	if (typeof expected !== 'string' || typeof provided !== 'string' || !expected || !provided) return false;
	const a = Buffer.from(expected);
	const b = Buffer.from(provided);
	return a.length === b.length && timingSafeEqual(a, b);
}
