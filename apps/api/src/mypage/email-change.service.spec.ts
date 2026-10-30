import { createHash } from 'node:crypto';
import {
  EmailChangeService,
  MAX_ATTEMPTS,
  RESEND_MS,
} from './email-change.service';

const codeHash = (userId: number, code: string) =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

const setup = () => {
  const prisma = {
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    emailChange: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const mail = { sendHtmlMail: jest.fn().mockResolvedValue({}) };
  const service = new EmailChangeService(prisma as never, mail as never);
  return { prisma, mail, service };
};

/** user.findUnique: id로 찾으면 내 정보, email로 찾으면 그 주소를 쓰는 계정 */
const users = (me: string, takenBy: Record<string, number> = {}) =>
  jest.fn(({ where }) =>
    Promise.resolve(
      where.id
        ? { email: me }
        : takenBy[where.email]
          ? { id: takenBy[where.email] }
          : null,
    ),
  );

describe('EmailChangeService 코드 보내기', () => {
  it('새 주소로 6자리 코드를 보내고, 코드는 해시만 저장한다', async () => {
    const { prisma, mail, service } = setup();
    prisma.user.findUnique = users('old@example.com');

    const result = await service.sendCode(7, '  New@Example.com ');

    expect(result.email).toBe('new@example.com');
    const [to, , html, subject] = mail.sendHtmlMail.mock.calls[0];
    expect(to).toBe('new@example.com');
    expect(subject).toContain('인증 코드');
    const code = html.match(/>(\d{6})</)[1];
    const saved = prisma.emailChange.upsert.mock.calls[0][0];
    expect(saved.create.codeHash).toBe(codeHash(7, code));
    expect(JSON.stringify(saved)).not.toContain(`"${code}"`);
  });

  it('지금 주소 · 다른 계정이 쓰는 주소 · 1분 안에 다시 받기는 막는다', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique = users('me@example.com', {
      'taken@example.com': 9,
    });

    await expect(service.sendCode(7, 'ME@example.com')).rejects.toMatchObject({
      code: 'EMAIL_UNCHANGED',
    });
    await expect(
      service.sendCode(7, 'taken@example.com'),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });

    prisma.emailChange.findUnique.mockResolvedValue({
      sentAt: new Date(Date.now() - RESEND_MS + 5000),
    });
    await expect(service.sendCode(7, 'new@example.com')).rejects.toMatchObject({
      code: 'EMAIL_CODE_TOO_SOON',
    });
  });
});

describe('EmailChangeService 코드 확인', () => {
  const pending = (over: Record<string, unknown> = {}) => ({
    userId: 7,
    newEmail: 'new@example.com',
    codeHash: codeHash(7, '123456'),
    attempts: 0,
    expiresAt: new Date(Date.now() + 60_000),
    ...over,
  });

  it('맞으면 이메일을 바꾸고 예전 주소에 알린다', async () => {
    const { prisma, mail, service } = setup();
    prisma.user.findUnique = users('old@example.com');
    prisma.emailChange.findUnique.mockResolvedValue(pending());

    expect(await service.verify(7, '123456')).toEqual({
      email: 'new@example.com',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { email: 'new@example.com' },
    });
    expect(prisma.emailChange.delete).toHaveBeenCalled();
    expect(mail.sendHtmlMail.mock.calls[0][0]).toBe('old@example.com');
  });

  it('틀리면 남은 횟수를 알려 주고, 다 틀리면 코드를 버린다', async () => {
    const { prisma, service } = setup();
    prisma.emailChange.findUnique.mockResolvedValue(pending());
    await expect(service.verify(7, '000000')).rejects.toMatchObject({
      code: 'EMAIL_CODE_INVALID',
      details: { attemptsLeft: MAX_ATTEMPTS - 1 },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();

    prisma.emailChange.findUnique.mockResolvedValue(
      pending({ attempts: MAX_ATTEMPTS - 1 }),
    );
    await expect(service.verify(7, '000000')).rejects.toMatchObject({
      code: 'EMAIL_CODE_EXPIRED',
    });
    expect(prisma.emailChange.deleteMany).toHaveBeenCalled();
  });

  it('만료됐거나 받은 코드가 없으면 다시 받게 한다', async () => {
    const { prisma, service } = setup();
    await expect(service.verify(7, '123456')).rejects.toMatchObject({
      code: 'EMAIL_CODE_EXPIRED',
    });
    prisma.emailChange.findUnique.mockResolvedValue(
      pending({ expiresAt: new Date(Date.now() - 1) }),
    );
    await expect(service.verify(7, '123456')).rejects.toMatchObject({
      code: 'EMAIL_CODE_EXPIRED',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('코드를 받은 사이 다른 계정이 그 주소를 쓰게 됐으면 바꾸지 않는다', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique = users('old@example.com', { 'new@example.com': 9 });
    prisma.emailChange.findUnique.mockResolvedValue(pending());
    await expect(service.verify(7, '123456')).rejects.toMatchObject({
      code: 'EMAIL_TAKEN',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
