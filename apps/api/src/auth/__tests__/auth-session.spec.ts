import { AuthController } from '../auth.controller';
import { SESSION_HINT_COOKIE } from '../cookie-options';
import { AppException } from 'src/common/errors/app.exception';

/** 쿠키 조작만 기록하는 응답 */
function fakeRes() {
	const cleared: string[] = [];
	const res: Record<string, jest.Mock> = {};
	res.clearCookie = jest.fn((name: string) => (cleared.push(name), res));
	res.cookie = jest.fn(() => res);
	res.status = jest.fn(() => res);
	res.json = jest.fn(() => res);
	return Object.assign(res, { cleared });
}

const request = (cookies: Record<string, string>) => ({ cookies, headers: {} }) as never;

function controllerWith(authService: Record<string, jest.Mock>) {
	return new AuthController(authService as never, {} as never);
}

describe('AuthController.logout (#340)', () => {
	it('access token 없이(req.user 없음) refresh token만으로 이 기기 세션을 지우고 쿠키를 지운다', async () => {
		const removeSession = jest.fn().mockResolvedValue(1);
		const res = fakeRes();

		await controllerWith({ removeSession }).logout(request({ refresh_token: 'r1' }), res as never);

		expect(removeSession).toHaveBeenCalledWith('r1');
		expect(res.cleared).toEqual(expect.arrayContaining(['access_token', 'refresh_token', SESSION_HINT_COOKIE]));
		expect(res.status).toHaveBeenCalledWith(200);
	});
});

describe('AuthController.refresh (#340)', () => {
	it('refresh token이 끝났으면 SESSION_EXPIRED와 함께 로그인 표시 쿠키를 지운다', async () => {
		const res = fakeRes();
		const error = await controllerWith({ rotateSession: jest.fn().mockResolvedValue(null) })
			.refresh(request({ refresh_token: 'r1' }), res as never)
			.catch((e) => e);

		expect(error).toBeInstanceOf(AppException);
		expect(res.cleared).toContain(SESSION_HINT_COOKIE);
	});

	it('DB 오류 같은 예외는 그대로 올려(500) 로그인 표시 쿠키를 지우지 않는다', async () => {
		const res = fakeRes();
		const dbError = new Error('Connection lost');
		const error = await controllerWith({ rotateSession: jest.fn().mockRejectedValue(dbError) })
			.refresh(request({ refresh_token: 'r1' }), res as never)
			.catch((e) => e);

		expect(error).toBe(dbError);
		expect(res.cleared).not.toContain(SESSION_HINT_COOKIE);
	});
});
