import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { BuiltMail, MailService, Subscriber } from './mail.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

function setup(sendMail: jest.Mock, createMany = jest.fn()) {
  (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  const prisma = { emailArchive: { createMany } };
  const service = new MailService(
    new Logger(),
    prisma as never,
    {} as never,
  ) as MailService & { retryBaseDelay: number };
  service.retryBaseDelay = 0;
  return { service, prisma };
}

/** 관심 분야 9는 그날 소식이 없다고 친다 */
const build = (s: Subscriber): BuiltMail | null =>
  s.interests.includes(9)
    ? null
    : {
        subject: `${s.name} 메일`,
        html: '<p></p>',
        newsletterIds: s.interests,
      };

describe('MailService.sendBulkMail', () => {
  it('메일에 붙인 헤더(List-Unsubscribe 등)를 그대로 보낸다 (#18)', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    const { service } = setup(sendMail);
    const headers = {
      'List-Unsubscribe':
        '<https://newpick.app/api/subscribers/unsubscribe?token=t>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
    await service.sendBulkMail(
      [{ email: 'a@example.com', interests: [1], name: 'a', userId: 1 }],
      (s) => ({ ...build(s)!, headers }),
    );
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ headers }));
  });

  it('일시적으로 실패한 메일은 다시 보내고, 성공하면 엮은 뉴스레터마다 기록을 남긴다', async () => {
    const sendMail = jest
      .fn()
      .mockRejectedValueOnce(new Error('421 try again'))
      .mockRejectedValueOnce(new Error('421 try again'))
      .mockResolvedValue({});
    const { service, prisma } = setup(sendMail);

    const result = await service.sendBulkMail(
      [{ email: 'a@example.com', interests: [1, 3], name: 'a' }],
      build,
    );

    expect(sendMail).toHaveBeenCalledTimes(3);
    expect(sendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({ subject: 'a 메일', to: 'a@example.com' }),
    );
    expect(result.details[0]).toMatchObject({ success: true, attempts: 3 });
    expect(prisma.emailArchive.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ newsletterId: 1, email: 'a@example.com' }),
        expect.objectContaining({ newsletterId: 3, email: 'a@example.com' }),
      ],
    });
  });

  it('한 명이 끝까지 실패해도 나머지에게는 보내고, 결과 형태는 항상 같다', async () => {
    const sendMail = jest.fn(({ to }) =>
      to === 'bad@example.com'
        ? Promise.reject(new Error('550 no such user'))
        : Promise.resolve({}),
    );
    const { service } = setup(sendMail);

    const result = await service.sendBulkMail(
      [
        { email: 'bad@example.com', interests: [1], name: 'bad' },
        { email: 'ok@example.com', interests: [2], name: 'ok' },
        { email: 'none@example.com', interests: [9], name: 'none' },
      ],
      build,
    );

    expect(result).toMatchObject({ success: 1, failed: 1, skipped: 1 });
    expect(result.details).toHaveLength(3);
    expect(
      sendMail.mock.calls.filter(([o]) => o.to === 'bad@example.com'),
    ).toHaveLength(3);
  });

  it('발송 기록이 실패해도 같은 메일을 다시 보내지 않는다', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    const { service } = setup(
      sendMail,
      jest.fn().mockRejectedValue(new Error('db down')),
    );

    const result = await service.sendBulkMail(
      [{ email: 'a@example.com', interests: [1], name: 'a' }],
      build,
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(result.details[0]).toMatchObject({ success: true, attempts: 1 });
  });
});
