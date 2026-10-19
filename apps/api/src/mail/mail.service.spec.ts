import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { Newsletter } from '@prisma/client';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

const newsletter = (id: number, categoryId: number) =>
  ({ id, categoryId, title: `n${id}`, content: '' }) as Newsletter;

function setup(sendMail: jest.Mock) {
  (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  const prisma = { emailArchive: { create: jest.fn() } };
  const service = new MailService(
    new Logger(),
    prisma as never,
    {} as never,
  ) as MailService & { retryBaseDelay: number };
  service.retryBaseDelay = 0;
  return { service, prisma };
}

describe('MailService.sendBulkMailWithMultipleNewsletter', () => {
  const newsletters = [newsletter(1, 1), newsletter(2, 2)];

  it('일시적으로 실패한 메일은 다시 보내고, 성공하면 아카이브를 남긴다', async () => {
    const sendMail = jest
      .fn()
      .mockRejectedValueOnce(new Error('421 try again'))
      .mockRejectedValueOnce(new Error('421 try again'))
      .mockResolvedValue({});
    const { service, prisma } = setup(sendMail);

    const result = await service.sendBulkMailWithMultipleNewsletter(
      [{ email: 'a@example.com', interests: [1], name: 'a' }],
      newsletters,
    );

    expect(sendMail).toHaveBeenCalledTimes(3);
    expect(result.details[0]).toMatchObject({ success: true, attempts: 3 });
    expect(prisma.emailArchive.create).toHaveBeenCalledTimes(1);
  });

  it('한 명이 끝까지 실패해도 나머지에게는 보내고, 결과 형태는 항상 같다', async () => {
    const sendMail = jest.fn(({ to }) =>
      to === 'bad@example.com'
        ? Promise.reject(new Error('550 no such user'))
        : Promise.resolve({}),
    );
    const { service } = setup(sendMail);

    const result = await service.sendBulkMailWithMultipleNewsletter(
      [
        { email: 'bad@example.com', interests: [1], name: 'bad' },
        { email: 'ok@example.com', interests: [2], name: 'ok' },
        { email: 'none@example.com', interests: [9], name: 'none' },
      ],
      newsletters,
    );

    expect(result).toMatchObject({ success: 1, failed: 1, skipped: 1 });
    expect(result.details).toHaveLength(3);
    expect(
      sendMail.mock.calls.filter(([o]) => o.to === 'bad@example.com'),
    ).toHaveLength(3);
  });

  it('구독자에게는 관심 카테고리 뉴스레터만 보낸다', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    const { service, prisma } = setup(sendMail);

    await service.sendBulkMailWithMultipleNewsletter(
      [{ email: 'a@example.com', interests: [2], name: 'a' }],
      newsletters,
    );
    expect(prisma.emailArchive.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ newsletterId: 2 }),
    });
  });
});
