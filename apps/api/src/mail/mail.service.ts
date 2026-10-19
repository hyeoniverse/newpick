import { Inject, Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import PQueue from '@esm2cjs/p-queue';
import { Newsletter } from '@prisma/client';
import { MysqlPrismaService } from '../../prisma/mysql.service';
import { NODEMAILER } from './constants';
import { newsletterTemplate } from './htmlTemplate';

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
   * 구독자마다 관심 카테고리의 뉴스레터만 모아 한 통으로 보냅니다.
   * 한 명이 실패해도 나머지는 계속 보내고, 결과는 항상 같은 형태로 돌려줍니다.
   */
  async sendBulkMailWithMultipleNewsletter(
    subscribers: { email: string; interests: number[]; name: string }[],
    newsletters: Newsletter[],
    introductionHTML = '',
  ): Promise<BulkMailResult> {
    const queue = new PQueue({
      concurrency: SEND_CONCURRENCY,
      intervalCap: SEND_PER_SECOND,
      interval: 1000,
    });

    const details = await Promise.all(
      subscribers.map((subscriber) =>
        queue.add(() =>
          this.sendNewsletterTo(subscriber, newsletters, introductionHTML),
        ),
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

  private async sendNewsletterTo(
    subscriber: { email: string; interests: number[]; name: string },
    newsletters: Newsletter[],
    introductionHTML: string,
  ): Promise<MailResult> {
    const matched = newsletters.filter((newsletter) =>
      subscriber.interests.includes(newsletter.categoryId),
    );
    if (matched.length === 0) {
      return { email: subscriber.email, success: true, skipped: true };
    }

    const html = introductionHTML + matched.map(newsletterTemplate).join('');
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: subscriber.email,
          subject: `안녕하세요 ${subscriber.name}님! 이번주 뉴스레터가 도착했습니다.`,
          html,
        });
        await this.prisma.emailArchive.create({
          data: {
            newsletterId: matched[0].id, // 대표 뉴스레터
            sentAt: new Date(),
            email: subscriber.email,
          },
        });
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
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
