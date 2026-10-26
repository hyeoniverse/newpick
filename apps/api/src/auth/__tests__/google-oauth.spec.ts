import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleOAuthGuard, missingGoogleEnv } from '../google-oauth.guard';
import { GoogleStrategy } from '../google.strategy';

const KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

const configure = (values: Partial<Record<(typeof KEYS)[number], string>>) => {
  for (const k of KEYS) {
    if (values[k] === undefined) delete process.env[k];
    else process.env[k] = values[k];
  }
};

afterEach(() => {
  configure(saved as Record<string, string>);
  jest.restoreAllMocks();
});

describe('Google 로그인 설정이 없을 때', () => {
  it('서버 시작(전략 생성)에서 예외를 던지지 않는다 (이전: OAuth2Strategy requires a clientID option)', () => {
    configure({});
    expect(() => new GoogleStrategy()).not.toThrow();
  });

  it('로그인 경로는 빠진 키 이름과 함께 503', () => {
    configure({ GOOGLE_CLIENT_ID: 'id' });
    const guard = new GoogleOAuthGuard();

    expect(() => guard.canActivate({} as ExecutionContext)).toThrow(
      ServiceUnavailableException,
    );
    expect(missingGoogleEnv()).toEqual([
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
    ]);
  });

  it('셋 다 있으면 passport의 Google 인증으로 넘긴다', () => {
    configure({
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/auth/google/callback',
    });
    const parent = Object.getPrototypeOf(
      GoogleOAuthGuard.prototype,
    ) as InstanceType<ReturnType<typeof AuthGuard>>;
    const passport = jest.spyOn(parent, 'canActivate').mockReturnValue(true);

    expect(new GoogleOAuthGuard().canActivate({} as ExecutionContext)).toBe(
      true,
    );
    expect(passport).toHaveBeenCalledTimes(1);
  });
});
