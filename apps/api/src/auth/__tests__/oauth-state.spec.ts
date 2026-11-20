import { CookieStateStore, OAUTH_STATE_COOKIE, sameState } from '../oauth-state';

/** passport-oauth2가 넘기는 req와 비슷하게: 쿠키 읽기 + req.res로 쿠키 쓰기 · 지우기 */
function fakeReq(cookies: Record<string, string> = {}) {
	const res = { cookie: jest.fn(), clearCookie: jest.fn() };
	return { req: { cookies, res } as never, res };
}

describe('Google 로그인 state (로그인 CSRF 막기)', () => {
	const store = new CookieStateStore();

	it('passport-oauth2가 인자 3개짜리로 부르게 store · verify 모두 인자 3개', () => {
		expect(store.store.length).toBe(3);
		expect(store.verify.length).toBe(3);
	});

	it('보낼 때: 무작위 state를 httpOnly 쿠키에 두고 같은 값을 돌려준다 (매번 다름)', () => {
		const { req, res } = fakeReq();
		const states: string[] = [];
		store.store(req, {}, (error, state) => {
			expect(error).toBeNull();
			states.push(state as string);
		});
		store.store(req, {}, (_e, state) => states.push(state as string));
		expect(states[0]).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(states[0]).not.toBe(states[1]);
		const [name, value, options] = res.cookie.mock.calls[0];
		expect(name).toBe(OAUTH_STATE_COOKIE);
		expect(value).toBe(states[0]);
		expect(options).toMatchObject({ httpOnly: true, secure: true, maxAge: 10 * 60 * 1000 });
	});

	it('돌아올 때: 쿠키와 주소의 state가 같아야 통과하고, 쿠키는 지운다', () => {
		const { req, res } = fakeReq({ [OAUTH_STATE_COOKIE]: 'abc123' });
		const callback = jest.fn();
		store.verify(req, 'abc123', callback);
		// 문자열이 아니라 true: 문자열이면 passport-oauth2가 PKCE code_verifier로 구글에 보내 로그인이 실패한다
		expect(callback).toHaveBeenCalledWith(null, true);
		expect(res.clearCookie).toHaveBeenCalledWith(OAUTH_STATE_COOKIE, expect.objectContaining({ httpOnly: true }));
	});

	it('공격자가 받은 콜백 주소를 피해자가 열면(피해자에게 그 쿠키가 없음) 거절한다', () => {
		for (const [cookies, provided] of [
			[{}, 'attacker-state'],
			[{ [OAUTH_STATE_COOKIE]: 'victim-state' }, 'attacker-state'],
			[{ [OAUTH_STATE_COOKIE]: 'abc' }, undefined],
		] as const) {
			const { req, res } = fakeReq(cookies as Record<string, string>);
			const callback = jest.fn();
			store.verify(req, provided as never, callback);
			expect(callback).toHaveBeenCalledWith(null, false, expect.objectContaining({ message: expect.any(String) }));
			expect(res.clearCookie).toHaveBeenCalled();
		}
	});

	it('비교는 길이가 달라도 던지지 않는다', () => {
		expect(sameState('a', 'ab')).toBe(false);
		expect(sameState('', '')).toBe(false);
		expect(sameState(['x'], 'x')).toBe(false);
		expect(sameState('same', 'same')).toBe(true);
	});
});

describe('GoogleStrategy에 state가 실제로 걸린다', () => {
	it('구글로 보내는 주소에 state가 붙고, 같은 값이 쿠키에 담긴다', async () => {
		const { GoogleStrategy } = await import('../google.strategy');
		const strategy = new GoogleStrategy() as unknown as {
			authenticate(req: unknown, options?: object): void;
			redirect: jest.Mock;
			error: jest.Mock;
		};
		strategy.redirect = jest.fn();
		strategy.error = jest.fn();
		const { req, res } = fakeReq();
		strategy.authenticate(
			Object.assign(req as object, {
				query: {},
				headers: { host: 'localhost:3000' },
				url: '/auth/google',
				connection: {},
			}),
			{},
		);
		expect(strategy.error).not.toHaveBeenCalled();
		const location = new URL(strategy.redirect.mock.calls[0][0]);
		const state = location.searchParams.get('state');
		expect(state).toBeTruthy();
		expect(res.cookie).toHaveBeenCalledWith(OAUTH_STATE_COOKIE, state, expect.any(Object));
	});
});
