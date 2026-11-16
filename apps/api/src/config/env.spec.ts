import { env, rawEnv } from './env';

describe('env', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('읽을 때마다 지금 값을 가져온다 (테스트 · 늦은 .env에도 맞음)', () => {
    process.env.FRONTEND_URL = 'http://a.test';
    expect(env.frontendUrl).toBe('http://a.test');
    process.env.FRONTEND_URL = 'http://b.test';
    expect(env.frontendUrl).toBe('http://b.test');
  });

  it('없거나 빈 값이면 기본값 (예전 `X || 기본값`과 같음)', () => {
    delete process.env.PORT;
    process.env.CLAUDE_MODEL = '';
    delete process.env.APP_VERSION;
    delete process.env.COOKIE_SAMESITE;
    delete process.env.AI_FALLBACK_DAILY_USD;
    expect(env.port).toBe(3001);
    expect(env.claudeModel).toBe('claude-sonnet-5-5');
    expect(env.appVersion).toBe('dev');
    expect(env.cookieSameSite).toBe('lax');
    expect(env.aiFallbackDailyUsd).toBe(0.1);
  });

  it('숫자 · 선택 값 · 묶음', () => {
    process.env.PORT = '4000';
    process.env.AI_FALLBACK_DAILY_USD = '0';
    process.env.CF_ACCOUNT_ID = 'acc';
    process.env.MAIL_USER = '';
    expect(env.port).toBe(4000);
    expect(env.aiFallbackDailyUsd).toBe(0);
    expect(env.cloudflare.accountId).toBe('acc');
    expect(env.mailUser).toBeUndefined();
  });

  it("예약 작업은 'false'일 때만 끈다", () => {
    delete process.env.SCHEDULER_ENABLED;
    expect(env.schedulerEnabled).toBe(true);
    process.env.SCHEDULER_ENABLED = 'false';
    expect(env.schedulerEnabled).toBe(false);
  });

  it('rawEnv는 원래 환경을 그대로 준다', () => {
    process.env.GOOGLE_CLIENT_ID = 'x';
    expect(rawEnv().GOOGLE_CLIENT_ID).toBe('x');
  });
});
