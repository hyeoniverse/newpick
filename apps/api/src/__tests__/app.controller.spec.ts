import { AppController } from '../app.controller';

describe('GET /health', () => {
  const saved = process.env.APP_VERSION;
  afterEach(() => {
    if (saved === undefined) delete process.env.APP_VERSION;
    else process.env.APP_VERSION = saved;
  });

  it('이미지의 APP_VERSION을 알려 준다 (배포 스크립트가 새 버전이 떴는지 확인)', () => {
    process.env.APP_VERSION = 'sha-1a2b3c4';
    expect(new AppController().getHealth()).toEqual({
      status: 'ok',
      version: 'sha-1a2b3c4',
    });
  });

  it('로컬 빌드처럼 APP_VERSION이 없으면 dev', () => {
    delete process.env.APP_VERSION;
    expect(new AppController().getHealth().version).toBe('dev');
  });
});

describe('GET /contact', () => {
  const saved = process.env.MAIL_USER;
  afterEach(() => {
    if (saved === undefined) delete process.env.MAIL_USER;
    else process.env.MAIL_USER = saved;
  });

  it('문의처는 구독 메일을 보내는 주소', () => {
    process.env.MAIL_USER = 'hello@newpick.app';
    expect(new AppController().getContact()).toEqual({
      email: 'hello@newpick.app',
    });
  });

  it('발송 주소가 없으면 null (화면에서 숨긴다)', () => {
    delete process.env.MAIL_USER;
    expect(new AppController().getContact().email).toBeNull();
  });
});
