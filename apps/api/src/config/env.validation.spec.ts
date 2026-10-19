import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('JWT 비밀값이 없으면 시작하지 않는다', () => {
    expect(() => validateEnv({ JWT_SECRET: 'a' })).toThrow(
      'JWT_REFRESH_SECRET',
    );
  });

  it('access와 refresh 비밀값이 같으면 시작하지 않는다', () => {
    expect(() =>
      validateEnv({ JWT_SECRET: 'same', JWT_REFRESH_SECRET: 'same' }),
    ).toThrow('서로 달라야');
  });

  it('둘 다 있고 서로 다르면 통과한다', () => {
    const env = { JWT_SECRET: 'a', JWT_REFRESH_SECRET: 'b' };
    expect(validateEnv(env)).toBe(env);
  });
});
