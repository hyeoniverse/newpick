import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { MailService } from 'src/mail/mail.service';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';
import { CrawlingService } from 'src/crawling/crawling.service';
import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { SubscriberService } from 'src/subscriber/subscriber.service';
import { KST, kstDaysAgo } from 'src/common/kst';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { CategoryRepository } from 'src/category/category.repository';
import { CronExpression } from 'src/common/constants';
import { NewsletterRepo } from 'src/repository/newsletter.repository';
import { CronJob, CronTime } from 'cron';
import { setTimeofCycle } from 'src/common/helpers';
import { EditionService } from 'src/edition/edition.service';
import { SiteCacheService } from 'src/site-cache/site-cache.service';
/** schedule_configs에서 메일 발송 주기를 저장하는 행 */
const MAIL_CYCLE_CONFIG_ID = 1;
const MAIL_JOB_NAME = 'sendNewsletter';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private isCrawlingEnabled = true;
  private isAiSummaryEnabled = true;
  private isMailSendEnabled = true;
  /** 진행 중인 뉴스레터 생성. 메일 발송은 이것이 끝나기를 기다린다 (#55) */
  private summaryRun: Promise<void> | null = null;
  constructor(
    private readonly logger: Logger,
    private readonly mailService: MailService,
    private readonly aiSummaryService: AiSummaryService,
    private readonly crawlingService: CrawlingService,
    private readonly subscriberService: SubscriberService,
    private readonly crawlingRepository: CrawlingRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly newsletterRepository: NewsletterRepo,
    private schedulerRegistry: SchedulerRegistry,
    private readonly prisma: MysqlPrismaService,
    private readonly editionService: EditionService,
    private readonly siteCache: SiteCacheService,
  ) {}

  /**
   * 메일 발송 cron을 등록합니다. 관리자가 바꿔 둔 주기가 DB에 있으면 그 값을 씁니다.
   * (이전에는 주기가 메모리에만 있어 재시작하면 기본값으로 돌아갔습니다.)
   * 데코레이터로 등록한 cron은 라이브러리의 부트스트랩 단계에서야 레지스트리에 들어가 순서를 보장할 수 없어서,
   * 이 작업만 직접 등록합니다.
   */
  async onApplicationBootstrap() {
    const config = await this.prisma.scheduleConfig.findUnique({
      where: { id: MAIL_CYCLE_CONFIG_ID },
    });
    const cronTime = config
      ? setTimeofCycle(config.hour, config.day)
      : CronExpression.EVERY_DAY_AT_840AM; // 매일 (#55)
    const job = CronJob.from({
      cronTime,
      timeZone: KST,
      onTick: () => this.sendEmailSummary(),
      start: true,
    });
    this.schedulerRegistry.addCronJob(MAIL_JOB_NAME, job);
    this.logger.log(`메일 발송 주기: ${this.getMailSendCycle()} (${KST})`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    //한국시간으로 오전 8시
    name: 'startCrawling',
    timeZone: KST,
  })
  async startCrawling() {
    if (!this.isCrawlingEnabled) {
      this.logger.log('크롤링 스케줄러가 비활성화되었습니다.');
      return;
    }

    this.logger.debug(`크롤링 스케줄러가 활성화되었습니다.`);
    await this.crawlingService.crawling();
  }
  // ai 요약 스케줄러
  @Cron(CronExpression.EVERY_DAY_AT_830AM, {
    //한국시간으로 오전 8시 30분
    name: 'makeAiSummary',
    timeZone: KST,
  })
  async makeAiSummary() {
    if (this.summaryRun) return this.summaryRun;
    this.summaryRun = this.runAiSummary().finally(() => {
      this.summaryRun = null;
    });
    return this.summaryRun;
  }

  private async runAiSummary() {
    this.logger.debug('AI 요약 시작');

    if (!this.isAiSummaryEnabled) {
      this.logger.log('ai 요약 스케줄러가 비활성화되었습니다.');
      return;
    }

    try {
      const categoryList = await this.categoryRepository.findAll();
      const generatedNewsletter = [];
      const failedCategories: string[] = [];
      // 지난 7일(KST 날짜 기준)의 크롤링 원문을 요약합니다.
      const startDate = kstDaysAgo(7);
      const endDate = kstDaysAgo(0);

      // 카테고리 하나가 실패해도 나머지 카테고리는 계속 요약합니다.
      for (const category of categoryList) {
        try {
          const news = await this.crawlingRepository.getCrawledNews(
            startDate,
            endDate,
            category.id,
          );
          if (news.news.length === 0) {
            this.logger.warn(`카테고리 ${category.name}: 요약할 뉴스 없음`);
            continue;
          }
          const newsletter = await this.aiSummaryService.summarizeText(
            news.news,
            category.id,
            false,
          );
          if (newsletter.newsletter?.length > 0) {
            generatedNewsletter.push(...newsletter.newsletter);
          }
          this.logger.log(
            `카테고리 ${category.name}: 뉴스 ${news.news.length}건 요약`,
          );
        } catch (error) {
          failedCategories.push(category.name);
          this.logger.error(
            `카테고리 ${category.name} 요약 실패: ${error.message}`,
          );
        }
      }
      if (failedCategories.length) {
        this.logger.error(`요약 실패 카테고리: ${failedCategories.join(', ')}`);
      }

      // 오늘 나온 전 분야 소식을 한 번 편집해 둔다 (구독 메일·미리보기에 씀)
      await this.editionService.ensureEdition();

      // 새 글이 생겼으면 사이트 첫 화면·목록이 10분 기다리지 않고 바로 보여 주게 (#73)
      if (generatedNewsletter.length > 0) {
        await this.siteCache.refresh('뉴스레터 생성');
      }

      // 운영자 알림 메일은 ADMIN_NOTIFY_EMAIL이 설정된 경우에만 보냅니다.
      const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
      if (adminEmail && generatedNewsletter.length > 0) {
        await this.mailService.sendHtmlMail(
          adminEmail,
          '',
          generatedNewsletter.map((n) => n.content).join('\n\n'),
          `${generatedNewsletter.length}개의 뉴스레터가 생성되었습니다`,
        );
        this.logger.log(`생성 뉴스 수 : ${generatedNewsletter.length}`);
        this.logger.log('메일 발송 완료');
      }
    } catch (error) {
      this.logger.error(`AI 요약 실패: ${error.message}`);
    }
  }
  // @Cron(CronExpression.EVERY_5_SECONDS)
  // async sendAiSummary() {
  //   const subscribers = await this.subscriberService.getSubscribers();
  //   if (subscribers.length === 0) {
  //     throw new NotFoundException('구독자가 없습니다.');
  //     return;
  //   }
  //   this.logger.debug(subscribers[0]);
  // }

  /**
   * 구독 메일 발송 (기본: 매일 08:40 KST). cron 등록은 onApplicationBootstrap에서 합니다.
   * 구독자마다 고른 분야로 오늘 소식을 엮은 한 통을 보냅니다 (#55)
   */
  async sendEmailSummary() {
    if (!this.isMailSendEnabled) {
      this.logger.log('메일 발송 스케줄러가 비활성화되었습니다.');
      return;
    }
    // 생성이 늦어지면 끝난 뒤에 보낸다 (빠진 분야 없이)
    if (this.summaryRun) {
      this.logger.log('뉴스레터 생성이 끝나기를 기다립니다.');
      await this.summaryRun;
    }

    const subscribers = await this.subscriberService.getSubscribers();
    this.logger.debug(`구독자 수: ${subscribers.length}`);

    // cron 안에서 예외를 던지면 받는 곳이 없으므로 로그만 남깁니다.
    if (subscribers.length === 0) {
      this.logger.warn('구독자가 없습니다.');
      return;
    }

    // 관심사가 설정된 구독자만 필터링
    const validSubscribers = subscribers.filter(
      (subscriber) => subscriber.interests && subscriber.interests.length > 0,
    );

    if (validSubscribers.length === 0) {
      this.logger.warn('관심사가 설정된 구독자가 없습니다.');
      return;
    }

    // 오늘 나온 뉴스레터가 없으면 보내지 않는다 (어제 메일을 다시 보내지 않게)
    const edition = await this.editionService.ensureEdition();
    if (!edition) {
      this.logger.warn('오늘 나온 뉴스레터가 없어 메일을 보내지 않습니다.');
      return;
    }

    const result = await this.mailService.sendBulkMail(
      validSubscribers.map((subscriber) => ({
        email: subscriber.email,
        interests: subscriber.interests,
        name: subscriber.name,
        userId: subscriber.userId,
      })),
      // 사람마다 원클릭 해지(#18)를 붙여 만든다
      (subscriber) =>
        this.editionService.composeMail(
          edition,
          subscriber.interests,
          subscriber.userId,
        ),
    );

    this.logger.log(
      `발송 결과 ${result.success}건 성공, ${result.failed}건 실패, ${result.skipped}건 해당 없음`,
    );
  }

  toggleCrawlingScheduler(enable: boolean) {
    this.isCrawlingEnabled = Boolean(enable);
    this.logger.debug(this.isCrawlingEnabled ? '활성화' : '비활성화');
  }

  toggleAiSummaryScheduler(enable: boolean) {
    this.isAiSummaryEnabled = enable;
    this.logger.debug(this.isAiSummaryEnabled ? '활성화' : '비활성화');
  }

  toggleMailSendScheduler(enable: boolean) {
    this.isMailSendEnabled = enable;
    this.logger.debug(this.isMailSendEnabled ? '활성화' : '비활성화');
  }

  getSchedulerStatus() {
    return {
      crawling: this.isCrawlingEnabled,
      aiSummary: this.isAiSummaryEnabled,
      mailing: this.isMailSendEnabled,
      mailSendCycle: this.getMailSendCycle(),
    };
  }

  /** 메일 발송 주기 변경. DB에 저장해 재시작 후에도 유지합니다. hour: 0~23(그 시각 40분), day: 0(일)~6(토), 7: 매일 */
  async setMailSendCycle(hour: number, day: number) {
    await this.prisma.scheduleConfig.upsert({
      where: { id: MAIL_CYCLE_CONFIG_ID },
      create: { id: MAIL_CYCLE_CONFIG_ID, hour, day },
      update: { hour, day },
    });
    return this.applyMailSendCycle(hour, day);
  }

  private applyMailSendCycle(hour: number, day: number) {
    const job = this.schedulerRegistry.getCronJob(MAIL_JOB_NAME);
    job.setTime(new CronTime(setTimeofCycle(hour, day), KST));
    job.start();
    this.logger.log(`메일 발송 주기: ${this.getMailSendCycle()} (${KST})`);
    return this.getMailSendCycle();
  }

  async manualStartAiSummary() {
    this.logger.debug('AI 요약 수동 시작');
    try {
      await this.makeAiSummary(); // 직접 메서드 호출
    } catch (error) {
      this.logger.error(`수동 AI 요약 실패: ${error.message}`);
    }
  }
  async manualStartMailSend() {
    this.logger.debug('메일 발송 수동 시작');
    try {
      await this.sendEmailSummary(); // 직접 메서드 호출
    } catch (error) {
      this.logger.error(`수동 메일 발송 실패: ${error.message}`);
    }
  }

  async manualStartCrawling() {
    this.logger.debug('크롤링 수동 시작');
    try {
      await this.startCrawling(); // 직접 메서드 호출
    } catch (error) {
      this.logger.error(`수동 크롤링 실패: ${error.message}`);
    }
  }

  getMailSendCycle(): string {
    const job = this.schedulerRegistry.getCronJob(MAIL_JOB_NAME);
    return String(job.cronTime.source);
  }
}
