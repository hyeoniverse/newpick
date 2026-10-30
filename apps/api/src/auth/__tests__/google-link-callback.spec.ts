import { AuthController } from '../auth.controller';

/** 구글에서 돌아온 길: 바꾸기 쿠키가 있으면 새 로그인이 아니라 지금 계정의 연결을 바꾼다 */
const setup = (link: Record<string, unknown> | null, linkUserId = 7) => {
  process.env.FRONTEND_URL = 'http://web';
  const auth = {
    linkUserId: jest.fn().mockReturnValue(linkUserId),
    linkGoogleAccount: jest.fn().mockResolvedValue(link),
    validateOrCreateGoogleUser: jest.fn(),
    createSession: jest.fn(),
    generateAccessToken: jest.fn().mockResolvedValue('access'),
  };
  const mail = { sendHtmlMail: jest.fn().mockResolvedValue({}) };
  const res = {
    redirect: jest.fn(),
    clearCookie: jest.fn(),
    cookie: jest.fn(),
  };
  const controller = new AuthController(auth as never, mail as never);
  const req = (user: Record<string, unknown>) =>
    ({
      user: {
        googleSub: 'g-new',
        email: 'new@gmail.com',
        username: 'n',
        emailVerified: true,
        ...user,
      },
      cookies: { google_link: 'signed' },
      headers: {},
    }) as never;
  return { auth, mail, res, controller, req };
};

describe('Google 콜백: 다른 Google 계정으로 바꾸기', () => {
  it('바꾸고 예전 주소에 알린 뒤 마이페이지 설정으로 돌려보낸다 (새 세션은 만들지 않음)', async () => {
    const { auth, mail, res, controller, req } = setup({
      status: 'linked',
      oldEmail: 'old@gmail.com',
      email: 'new@gmail.com',
    });
    await controller.googleCallback(req({}), res as never);

    expect(auth.linkGoogleAccount).toHaveBeenCalledWith(
      7,
      'g-new',
      'new@gmail.com',
    );
    expect(res.clearCookie.mock.calls[0][0]).toBe('google_link');
    expect(mail.sendHtmlMail.mock.calls[0][0]).toBe('old@gmail.com');
    expect(res.redirect).toHaveBeenCalledWith(
      'http://web/mypage?tab=settings&google=linked',
    );
    expect(auth.createSession).not.toHaveBeenCalled();
    expect(auth.validateOrCreateGoogleUser).not.toHaveBeenCalled();
  });

  it('다른 계정이 쓰는 Google 계정이면 taken으로, Google이 확인하지 않은 주소면 바꾸지 않고 failed로', async () => {
    const taken = setup({ status: 'taken' });
    await taken.controller.googleCallback(taken.req({}), taken.res as never);
    expect(taken.res.redirect).toHaveBeenCalledWith(
      'http://web/mypage?tab=settings&google=taken',
    );
    expect(taken.mail.sendHtmlMail).not.toHaveBeenCalled();

    const unverified = setup({ status: 'linked' });
    await unverified.controller.googleCallback(
      unverified.req({ emailVerified: false }),
      unverified.res as never,
    );
    expect(unverified.auth.linkGoogleAccount).not.toHaveBeenCalled();
    expect(unverified.res.redirect).toHaveBeenCalledWith(
      'http://web/mypage?tab=settings&google=failed',
    );
  });

  it('쿠키가 틀리면(서명 · 만료) 바꾸기가 아니라 보통 로그인으로 처리한다', async () => {
    const { auth, res, controller, req } = setup(null, null as never);
    auth.validateOrCreateGoogleUser.mockResolvedValue({ id: 3 });
    auth.createSession.mockResolvedValue('refresh');
    await controller.googleCallback(req({}), res as never);
    expect(auth.linkGoogleAccount).not.toHaveBeenCalled();
    expect(auth.createSession).toHaveBeenCalled();
  });
});
