import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AppException } from '../common/errors/app.exception';
import { MailService } from '../mail/mail.service';

/** 인증 코드가 유효한 시간 */
export const CODE_TTL_MS = 10 * 60 * 1000;
/** 같은 사람이 코드를 다시 받을 수 있는 간격 */
export const RESEND_MS = 60 * 1000;
/** 틀릴 수 있는 횟수. 넘으면 코드를 버리고 다시 받게 한다 */
export const MAX_ATTEMPTS = 5;

/** 코드는 사용자 id와 묶어 해시만 둔다 (같은 코드라도 사람마다 다른 값) */
const hashCode = (userId: number, code: string) =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

const sameHash = (a: string, b: string) =>
  timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const mailHtml = (title: string, body: string) =>
  `<div style="font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
  <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:#3610e1">NewPick</p>
  <p style="margin:0 0 16px;font-size:18px;font-weight:700">${title}</p>
  ${body}
  <p style="margin:32px 0 0;font-size:12px;color:#737373">이 메일은 발신 전용입니다.</p>
</div>`;

/**
 * 마이페이지에서 이메일(로그인 · 메일 받는 주소) 바꾸기.
 * 새 주소로 6자리 코드를 보내고, 그 코드를 맞게 넣어야 바뀐다 (남의 주소로 메일이 가지 않게).
 * 로그인은 Google 계정 ID로 찾으므로 이메일을 바꿔도 같은 Google 계정으로 그대로 로그인한다
 */
@Injectable()
export class EmailChangeService {
  private readonly logger = new Logger(EmailChangeService.name);

  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly mail: MailService,
  ) {}

  async sendCode(userId: number, rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new AppException('USER_NOT_FOUND');
    if (normalizeEmail(user.email) === email)
      throw new AppException('EMAIL_UNCHANGED');
    await this.assertAvailable(userId, email);

    const now = Date.now();
    const pending = await this.prisma.emailChange.findUnique({
      where: { userId },
      select: { sentAt: true },
    });
    if (pending && now - pending.sentAt.getTime() < RESEND_MS)
      throw new AppException('EMAIL_CODE_TOO_SOON');

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(now + CODE_TTL_MS);
    const data = {
      newEmail: email,
      codeHash: hashCode(userId, code),
      attempts: 0,
      sentAt: new Date(now),
      expiresAt,
    };
    await this.prisma.emailChange.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    await this.mail.sendHtmlMail(
      email,
      '',
      mailHtml(
        '이메일 인증 코드',
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">뉴픽 마이페이지에 아래 코드를 넣으면 이 주소로 이메일이 바뀝니다. 10분 동안 쓸 수 있어요.</p>
  <p style="margin:0;padding:16px;border:1px solid #d9d9d9;border-radius:8px;font-size:28px;font-weight:800;letter-spacing:8px;text-align:center">${code}</p>
  <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b6b6b">직접 요청하지 않았다면 이 메일은 무시해 주세요. 이메일은 바뀌지 않습니다.</p>`,
      ),
      '[뉴픽] 이메일 인증 코드',
    );
    return { email, expiresAt, resendAfter: new Date(now + RESEND_MS) };
  }

  async verify(userId: number, code: string) {
    const pending = await this.prisma.emailChange.findUnique({
      where: { userId },
    });
    if (
      !pending ||
      pending.expiresAt.getTime() < Date.now() ||
      pending.attempts >= MAX_ATTEMPTS
    ) {
      if (pending) await this.discard(userId);
      throw new AppException('EMAIL_CODE_EXPIRED');
    }

    if (!sameHash(pending.codeHash, hashCode(userId, code))) {
      const attempts = pending.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await this.discard(userId);
        throw new AppException('EMAIL_CODE_EXPIRED');
      }
      await this.prisma.emailChange.update({
        where: { userId },
        data: { attempts },
      });
      throw new AppException('EMAIL_CODE_INVALID', undefined, {
        attemptsLeft: MAX_ATTEMPTS - attempts,
      });
    }

    const before = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    await this.assertAvailable(userId, pending.newEmail);
    try {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { email: pending.newEmail },
        }),
        this.prisma.emailChange.delete({ where: { userId } }),
      ]);
    } catch (error) {
      // 코드를 받은 사이에 다른 계정이 같은 주소로 가입한 경우
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new AppException('EMAIL_TAKEN');
      throw error;
    }

    if (before) await this.notifyOldAddress(before.email, pending.newEmail);
    return { email: pending.newEmail };
  }

  private async assertAvailable(userId: number, email: string) {
    const taken = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (taken && taken.id !== userId) throw new AppException('EMAIL_TAKEN');
  }

  private discard(userId: number) {
    return this.prisma.emailChange.deleteMany({ where: { userId } });
  }

  /** 예전 주소에 알림 (본인이 아니면 알아챌 수 있게). 못 보내도 바꾸기는 그대로 */
  private async notifyOldAddress(oldEmail: string, newEmail: string) {
    try {
      await this.mail.sendHtmlMail(
        oldEmail,
        '',
        mailHtml(
          '이메일이 바뀌었어요',
          `<p style="margin:0;font-size:15px;line-height:1.6">뉴픽 계정의 이메일이 <b>${newEmail}</b>(으)로 바뀌었습니다. 앞으로 뉴스레터는 새 주소로 갑니다.</p>
  <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b6b6b">직접 바꾸지 않았다면 hyeoniverse.dev@gmail.com으로 알려 주세요.</p>`,
        ),
        '[뉴픽] 이메일이 바뀌었어요',
      );
    } catch (error) {
      this.logger.warn(`예전 주소 알림 실패: ${(error as Error).message}`);
    }
  }
}
