import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('JWT 비밀값이 없으면 시작하지 않는다', () => {
    expect(() =>
      validateEnv({ JWT_SECRET: 'a', FRONTEND_URL: 'http://localhost:3000' }),
    ).toThrow('JWT_REFRESH_SECRET');
  });

  it('FRONTEND_URL이 없으면 시작하지 않는다 (CORS·로그인 리디렉션에 필요)', () => {
    expect(() =>
      validateEnv({ JWT_SECRET: 'a', JWT_REFRESH_SECRET: 'b' }),
    ).toThrow('FRONTEND_URL');
  });

  it('access와 refresh 비밀값이 같으면 시작하지 않는다', () => {
    expect(() =>
      validateEnv({
        JWT_SECRET: 'same',
        JWT_REFRESH_SECRET: 'same',
        FRONTEND_URL: 'http://localhost:3000',
      }),
    ).toThrow('서로 달라야');
  });

  it('둘 다 있고 서로 다르면 통과한다', () => {
    const env = {
      JWT_SECRET: 'a',
      JWT_REFRESH_SECRET: 'b',
      FRONTEND_URL: 'http://localhost:3000',
    };
    expect(validateEnv(env)).toBe(env);
  });
});
