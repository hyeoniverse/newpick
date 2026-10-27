import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from './unsubscribe-token';

describe('원클릭 해지 토큰 (#18)', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.JWT_SECRET = 'jwt-secret';
    delete process.env.UNSUBSCRIBE_SECRET;
  });
  afterAll(() => {
    process.env = env;
  });

  it('만든 토큰은 그 회원 id로 풀린다', () => {
    expect(verifyUnsubscribeToken(createUnsubscribeToken(22))).toBe(22);
  });

  it('다른 회원 id로 바꾸거나 서명을 고치면 null', () => {
    const [, sig] = createUnsubscribeToken(22).split('.');
    expect(verifyUnsubscribeToken(`23.${sig}`)).toBeNull();
    expect(verifyUnsubscribeToken(`22.${sig.slice(0, -1)}A`)).toBeNull();
  });

  it('모양이 다르면 null (빈 값 · 숫자 아님 · 배열)', () => {
    for (const bad of [
      '',
      'abc',
      '22',
      '22.',
      'x.y',
      22,
      ['22.a'],
      undefined,
    ]) {
      expect(verifyUnsubscribeToken(bad)).toBeNull();
    }
  });

  it('비밀 값이 바뀌면 예전 토큰은 무효', () => {
    const token = createUnsubscribeToken(22);
    process.env.UNSUBSCRIBE_SECRET = 'rotated';
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });
});
