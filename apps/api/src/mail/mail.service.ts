import { Inject, Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import PQueue from '@esm2cjs/p-queue';
import { MysqlPrismaService } from '../../prisma/mysql.service';
import { NODEMAILER } from './constants';

/** Gmail SMTP 한도를 넘지 않도록 동시에 2통, 초당 최대 5통까지 보냅니다. */
const SEND_CONCURRENCY = 2;
const SEND_PER_SECOND = 5;
/** 일시적인 SMTP 오류에 대비해 실패한 메일은 최대 3번까지 보냅니다 (1초, 2초 간격). */
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1000;

export type MailResult = {
  email: string;
  success: boolean;
  skipped?: boolean;
  attempts?: number;
  error?: string;
};

export type Subscriber = { email: string; interests: number[]; name: string };

/** 구독자 한 명에게 보낼 메일. newsletterIds: 이 메일에 엮은 뉴스레터 (발송 기록) */
export type BuiltMail = {
  subject: string;
  html: string;
  newsletterIds: number[];
};

export type BulkMailResult = {
  success: number;
  failed: number;
  skipped: number;
  details: MailResult[];
};

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from = process.env.MAIL_USER;
  /** 재시도 간격 기준값. 테스트에서 0으로 바꿉니다. */
  protected retryBaseDelay = RETRY_BASE_DELAY;

  constructor(
    private readonly logger: Logger,
    private readonly prisma: MysqlPrismaService,
    @Inject(NODEMAILER) config: nodemailer.TransportOptions,
  ) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendHtmlMail(to: string, cc: string, html: string, subject: string) {
    return this.transporter.sendMail({
      from: this.from,
      to,
      cc,
      subject,
      html,
    });
  }

  /**
   * 구독자마다 build로 만든 메일 한 통을 보냅니다 (#55: 고른 분야로 엮은 한 통).
   * build가 null이면(고른 분야 소식이 없음) 보내지 않습니다.
   * 한 명이 실패해도 나머지는 계속 보내고, 결과는 항상 같은 형태로 돌려줍니다.
   */
  async sendBulkMail(
    subscribers: Subscriber[],
    build: (subscriber: Subscriber) => BuiltMail | null,
  ): Promise<BulkMailResult> {
    const queue = new PQueue({
      concurrency: SEND_CONCURRENCY,
      intervalCap: SEND_PER_SECOND,
      interval: 1000,
    });

    const details = await Promise.all(
      subscribers.map((subscriber) =>
        queue.add(() => this.sendMailTo(subscriber, build(subscriber))),
      ),
    );

    const result: BulkMailResult = {
      success: details.filter((r) => r.success && !r.skipped).length,
      failed: details.filter((r) => !r.success).length,
      skipped: details.filter((r) => r.skipped).length,
      details,
    };
    this.logger.log(
      `뉴스레터 발송: 성공 ${result.success}, 실패 ${result.failed}, 해당 없음 ${result.skipped}`,
    );
    return result;
  }

  private async sendMailTo(
    subscriber: Subscriber,
    mail: BuiltMail | null,
  ): Promise<MailResult> {
    if (!mail) {
      return { email: subscriber.email, success: true, skipped: true };
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: subscriber.email,
          subject: mail.subject,
          html: mail.html,
        });
        await this.archive(subscriber.email, mail.newsletterIds);
        return { email: subscriber.email, success: true, attempts: attempt };
      } catch (error) {
        this.logger.warn(
          `메일 발송 실패 (${attempt}/${MAX_ATTEMPTS}) ${subscriber.email}: ${error.message}`,
        );
        if (attempt === MAX_ATTEMPTS) {
          return {
            email: subscriber.email,
            success: false,
            attempts: attempt,
            error: error.message,
          };
        }
        await sleep(this.retryBaseDelay * attempt);
      }
    }
  }

  /**
   * 발송 기록. 한 통에 엮은 분야별 뉴스레터마다 남긴다.
   * 기록이 실패해도 메일은 이미 나갔으므로 다시 보내지 않는다 (같은 메일 두 번 방지)
   */
  private async archive(email: string, newsletterIds: number[]) {
    const sentAt = new Date();
    try {
      await this.prisma.emailArchive.createMany({
        data: newsletterIds.map((newsletterId) => ({
          newsletterId,
          sentAt,
          email,
        })),
      });
    } catch (error) {
      this.logger.warn(`발송 기록 실패 ${email}: ${error.message}`);
    }
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
