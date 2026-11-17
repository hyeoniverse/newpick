import { envProblems, validateEnv } from './env.validation';

describe('validateEnv', () => {
	it('JWT 비밀값이 없으면 시작하지 않는다', () => {
		expect(() => validateEnv({ JWT_SECRET: 'a', FRONTEND_URL: 'http://localhost:3000' })).toThrow('JWT_REFRESH_SECRET');
	});

	it('MONGO_URL이 없으면 시작하지 않는다 (수집한 기사 저장소)', () => {
		expect(() =>
			validateEnv({
				JWT_SECRET: 'a',
				JWT_REFRESH_SECRET: 'b',
				FRONTEND_URL: 'http://localhost:3000',
			}),
		).toThrow('MONGO_URL');
	});

	it('FRONTEND_URL이 없으면 시작하지 않는다 (CORS·로그인 리디렉션에 필요)', () => {
		expect(() => validateEnv({ JWT_SECRET: 'a', JWT_REFRESH_SECRET: 'b' })).toThrow('FRONTEND_URL');
	});

	it('access와 refresh 비밀값이 같으면 시작하지 않는다', () => {
		expect(() =>
			validateEnv({
				JWT_SECRET: 'same',
				JWT_REFRESH_SECRET: 'same',
				FRONTEND_URL: 'http://localhost:3000',
				MONGO_URL: 'mongodb://localhost/test',
			}),
		).toThrow('서로 달라야');
	});

	it('둘 다 있고 서로 다르면 통과한다', () => {
		const env = {
			JWT_SECRET: 'a',
			JWT_REFRESH_SECRET: 'b',
			FRONTEND_URL: 'http://localhost:3000',
			MONGO_URL: 'mongodb://localhost/test',
		};
		expect(validateEnv(env)).toBe(env);
	});
});

describe('envProblems', () => {
	const base = {
		JWT_SECRET: 'a',
		JWT_REFRESH_SECRET: 'b',
		FRONTEND_URL: 'http://localhost:3000',
		MONGO_URL: 'mongodb://localhost/test',
	};

	it('빈 문자열은 없는 것으로 본다', () => {
		expect(envProblems({ ...base, FRONTEND_URL: '' }).errors[0]).toContain('FRONTEND_URL');
	});

	it('형식이 틀리면 시작하지 않는다 (값이 있을 때만 본다)', () => {
		const { errors } = envProblems({
			...base,
			FRONTEND_URL: 'localhost:3000',
			PORT: '0',
			AI_FALLBACK_DAILY_USD: '-1',
			COOKIE_SAMESITE: 'Lax',
			SCHEDULER_ENABLED: 'no',
			GOOGLE_REDIRECT_URI: 'ftp://x',
		});
		expect(errors).toHaveLength(6);
		expect(() => validateEnv({ ...base, PORT: 'abc' })).toThrow('PORT');
		expect(envProblems({ ...base, PORT: '', COOKIE_SAMESITE: '' }).errors).toEqual([]);
	});

	it('함께 있어야 하는 값이 일부만 있으면 알리기만 한다', () => {
		const { errors, warnings } = envProblems({
			...base,
			GOOGLE_CLIENT_ID: 'id',
			CF_ACCOUNT_ID: 'acc',
			MAIL_USER: 'm',
			MAIL_PASSWORD: 'p',
		});
		expect(errors).toEqual([]);
		expect(warnings).toHaveLength(2);
		expect(warnings[0]).toContain('GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI');
		expect(warnings[1]).toContain('CF_AI_TOKEN');
	});

	it('기능 값이 하나도 없으면 알리지 않는다 (그 기능을 안 쓰는 것)', () => {
		expect(envProblems(base)).toEqual({ errors: [], warnings: [] });
	});
});
