import { MailPlan, planMail } from 'src/edition/personalize';
import { TasteService } from 'src/taste/taste.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { MailService } from 'src/mail/mail.service';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';
import { CrawlingService } from 'src/crawling/crawling.service';
import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { SubscriberService } from 'src/subscriber/subscriber.service';
import { KST } from 'src/common/kst';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { CategoryRepository } from 'src/category/category.repository';
import { NewsletterRepo } from 'src/repository/newsletter.repository';
import { CronJob, CronTime } from 'cron';
import { setTimeofCycle } from 'src/common/helpers';
import { EditionService } from 'src/edition/edition.service';
import { SiteCacheService } from 'src/site-cache/site-cache.service';
import { AppException } from 'src/common/errors/app.exception';
/** schedule_configs에서 메일 발송 주기를 저장하는 행 */
const MAIL_CYCLE_CONFIG_ID = 1;
const MAIL_JOB_NAME = 'sendNewsletter';
const CRAWL_JOB_NAME = 'startCrawling';
const SUMMARY_JOB_NAME = 'makeAiSummary';

/** 하루 중 시각 (KST) */
export interface ClockTime {
  hour: number;
  minute: number;
}

/** 예약 작업 시간 (#21). 메일은 요일도: 0(일)~6(토), 7 매일 */
export interface Schedule {
  crawl: ClockTime;
  summary: ClockTime;
  mail: ClockTime & { day: number };
}

/** 저장한 적이 없을 때: 수집 08:00 → AI 요약 08:30 → 메일 매일 08:40 */
export const DEFAULT_SCHEDULE: Schedule = {
  crawl: { hour: 8, minute: 0 },
  summary: { hour: 8, minute: 30 },
  mail: { hour: 8, minute: 40, day: 7 },
};

const dailyCron = ({ hour, minute }: ClockTime) => `0 ${minute} ${hour} * * *`;

/** 기사 수집 간격 (시간). 섹션 헤드라인은 그 순간 것만 보여 주므로, 하루 여러 번 모아 '그날의 뉴스'를 채운다 */
export const CRAWL_EVERY_HOURS = 3;

/** 수집 시각부터 CRAWL_EVERY_HOURS마다 (예: 08:00 → 08 · 11 · 14 · 17 · 20 · 23 · 02 · 05시) */
export const crawlCron = ({ hour, minute }: ClockTime) => {
  const hours = Array.from(
    { length: 24 / CRAWL_EVERY_HOURS },
    (_, i) => (hour + i * CRAWL_EVERY_HOURS) % 24,
  ).sort((a, b) => a - b);
  return `0 ${minute} ${hours.join(',')} * * *`;
};

/** 요약에 실패한 관심사를 다시 시도하는 횟수 · 간격 (스트리밍으로 시간 초과는 줄었지만, 과부하 · 일시 오류 대비) */
export const SUMMARY_RETRIES = 2;
const SUMMARY_RETRY_DELAY_MS = 60 * 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** AI 요약에 쓰는 기사: 요약 시각 전 이 시간 안에 처음 모은 것 (전날 수집 시각 ~ 오늘 요약 시각) */
export const SUMMARY_WINDOW_HOURS = 24;
const minutesOf = ({ hour, minute }: ClockTime) => hour * 60 + minute;

export type JobName = 'crawling' | 'summary' | 'mail';

/**
 * 작업의 마지막 실행 (#21 관리자 대시보드). 서버 메모리에만 두므로 재시작하면 비어 있다.
 * success: 다 됨, partial: 일부 실패, failed: 실패, skipped: 꺼져 있거나 할 일이 없어 건너뜀
 */
export type JobTrigger = 'schedule' | 'manual';

export interface JobRun {
  running: boolean;
  trigger: JobTrigger | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: 'success' | 'partial' | 'failed' | 'skipped' | null;
  message: string | null;
}

const emptyRun = (): JobRun => ({
  running: false,
  trigger: null,
  startedAt: null,
  finishedAt: null,
  status: null,
  message: null,
});

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private isCrawlingEnabled = true;
  private isAiSummaryEnabled = true;
  private isMailSendEnabled = true;
  /** 진행 중인 뉴스레터 생성. 메일 발송은 이것이 끝나기를 기다린다 (#55) */
  private summaryRun: Promise<void> | null = null;
  private readonly runs: Record<JobName, JobRun> = {
    crawling: emptyRun(),
    summary: emptyRun(),
    mail: emptyRun(),
  };
  /** 다음 실행이 관리자의 '지금 실행'인지 (예약 실행이 기본) */
  private readonly nextTrigger: Partial<Record<JobName, JobTrigger>> = {};
  /** 진행 중인 실행의 DB 기록 id (끝날 때 같은 줄을 고친다) */
  private readonly runRecord: Partial<Record<JobName, Promise<number | null>>> =
    {};
  private schedule: Schedule = DEFAULT_SCHEDULE;
  /**
   * 예약 시각에 저절로 돌릴지. SCHEDULER_ENABLED=false면 등록만 하고 시작하지 않는다 ('지금 실행'은 된다).
   * 로컬 개발 서버가 운영과 따로 Claude를 부르고(비용) 로컬 구독자에게 실제 메일을 보내지 않게
   */
  private readonly autoRun = process.env.SCHEDULER_ENABLED !== 'false';
  /** 요약 다시 시도 간격. 테스트에서 0으로 바꾼다 */
  protected summaryRetryDelayMs = SUMMARY_RETRY_DELAY_MS;
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
    private readonly tasteService: TasteService,
    private readonly siteCache: SiteCacheService,
  ) {}

  /**
   * 예약 작업(수집 · AI 요약 · 메일)을 등록합니다. 관리자가 바꿔 둔 시간이 DB에 있으면 그 값을 씁니다 (#21).
   * 데코레이터(@Cron)는 시간이 코드에 박혀 바꿀 수 없어, 세 작업 모두 직접 등록합니다
   */
  async onApplicationBootstrap() {
    const config = await this.prisma.scheduleConfig.findUnique({
      where: { id: MAIL_CYCLE_CONFIG_ID },
    });
    if (config) {
      this.schedule = {
        crawl: { hour: config.crawlHour, minute: config.crawlMinute },
        summary: { hour: config.summaryHour, minute: config.summaryMinute },
        mail: { hour: config.hour, minute: config.mailMinute, day: config.day },
      };
    }
    const add = (name: string, cronTime: string, onTick: () => Promise<void>) =>
      this.schedulerRegistry.addCronJob(
        name,
        CronJob.from({ cronTime, timeZone: KST, onTick, start: this.autoRun }),
      );
    add(CRAWL_JOB_NAME, crawlCron(this.schedule.crawl), () =>
      this.startCrawling(),
    );
    add(SUMMARY_JOB_NAME, dailyCron(this.schedule.summary), () =>
      this.makeAiSummary(),
    );
    const { hour, minute, day } = this.schedule.mail;
    add(MAIL_JOB_NAME, setTimeofCycle(hour, day, minute), () =>
      this.sendEmailSummary(),
    );
    this.logger.log(`예약 시간: ${JSON.stringify(this.schedule)} (${KST})`);
  }

  getSchedule(): Schedule {
    return structuredClone(this.schedule);
  }

  /**
   * 예약 시간 바꾸기 (#21). 수집 → AI 요약 → 메일 순서여야 한다:
   * 요약은 그날 수집한 기사로, 메일은 그날 요약으로 만든다. DB에 저장하고 바로 다시 건다
   */
  async setSchedule(next: Schedule) {
    const [crawl, summary, mail] = [next.crawl, next.summary, next.mail].map(
      minutesOf,
    );
    if (!(crawl < summary && summary < mail)) {
      throw new AppException(
        'BAD_REQUEST',
        '기사 수집 → AI 요약 → 구독 메일 순서로, 앞 작업보다 늦은 시각을 골라 주세요.',
      );
    }
    const data = {
      crawlHour: next.crawl.hour,
      crawlMinute: next.crawl.minute,
      summaryHour: next.summary.hour,
      summaryMinute: next.summary.minute,
      hour: next.mail.hour,
      mailMinute: next.mail.minute,
      day: next.mail.day,
    };
    await this.prisma.scheduleConfig.upsert({
      where: { id: MAIL_CYCLE_CONFIG_ID },
      create: { id: MAIL_CYCLE_CONFIG_ID, ...data },
      update: data,
    });
    this.schedule = structuredClone(next);
    this.reschedule(CRAWL_JOB_NAME, crawlCron(next.crawl));
    this.reschedule(SUMMARY_JOB_NAME, dailyCron(next.summary));
    this.reschedule(
      MAIL_JOB_NAME,
      setTimeofCycle(next.mail.hour, next.mail.day, next.mail.minute),
    );
    this.logger.log(`예약 시간 변경: ${JSON.stringify(next)} (${KST})`);
    return this.getSchedule();
  }

  private reschedule(name: string, cronTime: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    job.setTime(new CronTime(cronTime, KST));
    if (this.autoRun) job.start();
  }

  async startCrawling() {
    if (!this.isCrawlingEnabled) {
      this.logger.log('크롤링 스케줄러가 비활성화되었습니다.');
      this.finishRun('crawling', 'skipped', '스케줄러가 꺼져 있어 건너뜀');
      return;
    }

    this.logger.debug(`크롤링 스케줄러가 활성화되었습니다.`);
    this.startRun('crawling');
    try {
      const created = await this.crawlingService.crawling();
      this.finishRun(
        'crawling',
        'success',
        `기사 ${created?.length ?? 0}건 수집`,
      );
    } catch (error) {
      this.finishRun('crawling', 'failed', error.message);
      throw error;
    }
  }
  /** AI 요약 (예약 시간은 setSchedule로) */
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
      this.finishRun('summary', 'skipped', '스케줄러가 꺼져 있어 건너뜀');
      return;
    }
    this.startRun('summary');

    try {
      const categoryList = await this.categoryRepository.findAll();
      const generatedNewsletter = [];
      // 그날의 뉴스만: 요약 시각 전 24시간 안에 처음 모은 기사 (예전엔 지난 7일 전부라 지난 소식이 다시 실렸다)
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - SUMMARY_WINDOW_HOURS * 60 * 60 * 1000,
      );

      // 관심사 하나 요약: 만들었으면 true, 요약할 뉴스가 없으면 null, 실패하면 오류를 던진다
      const summarize = async (category: { id: number; name: string }) => {
        const news = await this.crawlingRepository.getCrawledNewsBetween(
          startDate,
          endDate,
          category.id,
        );
        if (news.length === 0) {
          this.logger.warn(`카테고리 ${category.name}: 요약할 뉴스 없음`);
          return null;
        }
        const newsletter = await this.aiSummaryService.summarizeText(
          news,
          category.id,
          false,
        );
        if (newsletter.newsletter?.length > 0) {
          generatedNewsletter.push(...newsletter.newsletter);
        }
        this.logger.log(
          `카테고리 ${category.name}: 뉴스 ${news.length}건 요약`,
        );
        return true;
      };

      // 카테고리 하나가 실패해도 나머지 카테고리는 계속 요약합니다.
      let failed: { id: number; name: string }[] = [];
      for (const category of categoryList) {
        try {
          await summarize(category);
        } catch (error) {
          failed.push(category);
          this.logger.error(
            `카테고리 ${category.name} 요약 실패: ${error.message}`,
          );
        }
      }

      // 실패한 관심사는 나머지를 다 만든 뒤 잠시 쉬었다가 다시 시도한다 (일시적인 시간 초과 · 과부하 대비)
      let retried = 0;
      for (let round = 1; round <= SUMMARY_RETRIES && failed.length; round++) {
        await sleep(this.summaryRetryDelayMs);
        this.logger.warn(
          `요약 다시 시도 ${round}/${SUMMARY_RETRIES}: ${failed.map((c) => c.name).join(', ')}`,
        );
        const still: typeof failed = [];
        for (const category of failed) {
          try {
            if (await summarize(category)) retried++;
          } catch (error) {
            still.push(category);
            this.logger.error(
              `카테고리 ${category.name} 다시 시도 실패: ${error.message}`,
            );
          }
        }
        failed = still;
      }
      const failedCategories = failed.map((c) => c.name);
      if (failedCategories.length) {
        this.logger.error(`요약 실패 카테고리: ${failedCategories.join(', ')}`);
      }
      const made = `뉴스레터 ${generatedNewsletter.length}편 생성`;
      const again = retried ? ` · 다시 시도로 ${retried}편` : '';
      const failedText = failedCategories.length
        ? ` · 실패: ${failedCategories.join(', ')}`
        : '';
      this.finishRun(
        'summary',
        failedCategories.length === 0
          ? 'success'
          : generatedNewsletter.length > 0
            ? 'partial'
            : 'failed',
        made + again + failedText,
      );

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
      // 뉴스레터는 이미 만들어졌고 뒤의 편집 · 캐시 · 알림에서 실패했을 수도 있어 실패로 덮어쓴다
      this.finishRun('summary', 'failed', error.message);
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
      this.finishRun('mail', 'skipped', '스케줄러가 꺼져 있어 건너뜀');
      return;
    }
    this.startRun('mail');
    try {
      await this.sendEditionToSubscribers();
    } catch (error) {
      this.finishRun('mail', 'failed', error.message);
      throw error;
    }
  }

  private async sendEditionToSubscribers() {
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
      this.finishRun('mail', 'skipped', '구독자 없음');
      return;
    }

    // 관심사가 설정된 구독자만 필터링
    const validSubscribers = subscribers.filter(
      (subscriber) => subscriber.interests && subscriber.interests.length > 0,
    );

    if (validSubscribers.length === 0) {
      this.logger.warn('관심사가 설정된 구독자가 없습니다.');
      this.finishRun('mail', 'skipped', '관심사를 고른 구독자 없음');
      return;
    }

    // 오늘 나온 뉴스레터가 없으면 보내지 않는다 (어제 메일을 다시 보내지 않게)
    const edition = await this.editionService.ensureEdition();
    if (!edition) {
      this.logger.warn('오늘 나온 뉴스레터가 없어 메일을 보내지 않습니다.');
      this.finishRun('mail', 'skipped', '오늘 나온 뉴스레터 없음');
      return;
    }

    // 맞춤 메일 (#123 3단계): 구독자 모두의 취향을 한 번에 계산 (AI 호출 없음). 실패하면 맞춤 없이 그대로 보낸다
    const profiles = await this.tasteService
      .profiles(
        validSubscribers
          .map((s) => s.userId)
          .filter((id): id is number => typeof id === 'number'),
      )
      .catch((error) => {
        this.logger.warn(
          `맞춤 취향 계산 실패, 맞춤 없이 보냄: ${error.message}`,
        );
        return new Map();
      });

    // 관심 점수는 뜻으로 (북마크 · 스크랩과 오늘 소식의 임베딩). 실패하면 관심 태그로만
    const texts = await this.tasteService
      .signalTexts([...profiles.keys()])
      .catch(() => new Map());
    const vectors = await this.editionService.embedForPlans(
      edition,
      profiles,
      texts,
    );

    // 사람마다: 관심 점수로 순서 · 다른 분야 소식을 정하고(계산), 오픈 모델로 제목 · 맞춤 브리핑을 쓴다.
    // 글쓰기는 3명씩 동시에. 못 쓰면 그 사람은 맞춤 순서만 있는 메일
    const plans = new Map<number, MailPlan | null>();
    const planned = validSubscribers.filter(
      (s) => typeof s.userId === 'number' && profiles.has(s.userId),
    );
    for (let i = 0; i < planned.length; i += 3) {
      await Promise.all(
        planned.slice(i, i + 3).map(async (subscriber) => {
          const profile = profiles.get(subscriber.userId!)!;
          const plan = planMail(
            edition.sources,
            subscriber.interests,
            profile,
            vectors,
          );
          if (plan)
            plan.note = await this.editionService.writeNote(
              edition,
              subscriber.interests,
              plan,
              profile,
            );
          plans.set(subscriber.userId!, plan);
        }),
      );
    }
    if (planned.length) {
      const notes = [...plans.values()].filter((p) => p?.note).length;
      this.logger.log(`맞춤 메일 ${plans.size}명 (사람마다 쓴 글 ${notes}명)`);
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
          subscriber.userId !== undefined ? plans.get(subscriber.userId) : null,
        ),
    );

    this.logger.log(
      `발송 결과 ${result.success}건 성공, ${result.failed}건 실패, ${result.skipped}건 해당 없음`,
    );
    this.finishRun(
      'mail',
      result.failed === 0
        ? 'success'
        : result.success > 0
          ? 'partial'
          : 'failed',
      `성공 ${result.success} · 실패 ${result.failed} · 해당 없음 ${result.skipped}`,
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
      autoRun: this.autoRun,
      crawling: this.isCrawlingEnabled,
      aiSummary: this.isAiSummaryEnabled,
      mailing: this.isMailSendEnabled,
      mailSendCycle: this.getMailSendCycle(),
      runs: this.getRuns(),
    };
  }

  /** 작업별 마지막 실행 (복사본) */
  getRuns(): Record<JobName, JobRun> {
    return {
      crawling: { ...this.runs.crawling },
      summary: { ...this.runs.summary },
      mail: { ...this.runs.mail },
    };
  }

  /** 이번 실행이 예약인지 '지금 실행'인지 (한 번 쓰면 비운다) */
  private takeTrigger(name: JobName): JobTrigger {
    const trigger = this.nextTrigger[name] ?? 'schedule';
    delete this.nextTrigger[name];
    return trigger;
  }

  private startRun(name: JobName) {
    const startedAt = new Date();
    const trigger = this.takeTrigger(name);
    this.runs[name] = {
      ...emptyRun(),
      running: true,
      trigger,
      startedAt: startedAt.toISOString(),
    };
    // DB에도 '진행 중'으로 남기고, 끝나면 같은 줄을 고친다. 기록이 실패해도 작업은 계속한다
    this.runRecord[name] = Promise.resolve()
      .then(() =>
        this.prisma.jobRun.create({
          data: { job: name, trigger, status: 'running', startedAt },
          select: { id: true },
        }),
      )
      .then((row) => row.id)
      .catch((error) => {
        this.logger.warn(`실행 기록 실패 (${name}): ${error.message}`);
        return null;
      });
  }

  private finishRun(name: JobName, status: JobRun['status'], message: string) {
    const run = this.runs[name];
    const finishedAt = new Date();
    // 꺼져 있어 바로 건너뛴 경우는 시작 시각도 지금
    const startedAt = run.running ? new Date(run.startedAt) : finishedAt;
    const trigger = run.running ? run.trigger : this.takeTrigger(name);
    this.runs[name] = {
      running: false,
      trigger,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      status,
      message,
    };

    const data = {
      status,
      message,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
    const recordId = run.running ? this.runRecord[name] : undefined;
    delete this.runRecord[name];
    void (async () => {
      try {
        const id = recordId ? await recordId : null;
        if (id) await this.prisma.jobRun.update({ where: { id }, data });
        else
          await this.prisma.jobRun.create({
            data: {
              job: name,
              trigger: trigger ?? 'schedule',
              startedAt,
              ...data,
            },
          });
      } catch (error) {
        this.logger.warn(`실행 기록 실패 (${name}): ${error.message}`);
      }
    })();
  }

  /** 메일 발송 주기 변경. DB에 저장해 재시작 후에도 유지합니다. hour: 0~23(그 시각 40분), day: 0(일)~6(토), 7: 매일 */
  async setMailSendCycle(hour: number, day: number) {
    await this.setSchedule({
      ...this.schedule,
      mail: { ...this.schedule.mail, hour, day },
    });
    return this.getMailSendCycle();
  }

  async manualStartAiSummary() {
    this.logger.debug('AI 요약 수동 시작');
    this.nextTrigger.summary = 'manual';
    try {
      await this.makeAiSummary(); // 직접 메서드 호출
    } catch (error) {
      this.logger.error(`수동 AI 요약 실패: ${error.message}`);
    }
  }
  async manualStartMailSend() {
    this.logger.debug('메일 발송 수동 시작');
    this.nextTrigger.mail = 'manual';
    try {
      await this.sendEmailSummary(); // 직접 메서드 호출
    } catch (error) {
      this.logger.error(`수동 메일 발송 실패: ${error.message}`);
    }
  }

  async manualStartCrawling() {
    this.logger.debug('크롤링 수동 시작');
    this.nextTrigger.crawling = 'manual';
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
