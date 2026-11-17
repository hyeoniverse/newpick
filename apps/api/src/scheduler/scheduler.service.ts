import type { Schedule } from '@newpick/shared';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, CronTime } from 'cron';
import { crawlCron, dailyCron, mailCron } from 'src/common/cron';
import { KST } from 'src/common/kst';
import { CrawlingService } from 'src/crawling/crawling.service';
import { env } from 'src/config/env';
import { JobRunsService } from './job-runs.service';
import { MailJobService } from './mail-job.service';
import { ScheduleConfigService } from './schedule-config.service';
import { SummaryJobService } from './summary-job.service';

const MAIL_JOB_NAME = 'sendNewsletter';
const CRAWL_JOB_NAME = 'startCrawling';
const SUMMARY_JOB_NAME = 'makeAiSummary';

/**
 * 예약 작업 조립 (#21): 수집 · AI 요약 · 메일을 cron에 걸고, 시각을 바꾸면 다시 건다. 상태 모으기 · '지금 실행'.
 * 작업 내용은 summary-job · mail-job, 실행 기록은 job-runs, 예약 시각 저장은 schedule-config
 */
@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private isCrawlingEnabled = true;
  /**
   * 예약 시각에 저절로 돌릴지. SCHEDULER_ENABLED=false면 등록만 하고 시작하지 않는다 ('지금 실행'은 된다).
   * 로컬 개발 서버가 운영과 따로 Claude를 부르고(비용) 로컬 구독자에게 실제 메일을 보내지 않게
   */
  private readonly autoRun = env.schedulerEnabled;

  constructor(
    private readonly logger: Logger,
    private readonly crawlingService: CrawlingService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly scheduleConfig: ScheduleConfigService,
    private readonly jobRuns: JobRunsService,
    private readonly summaryJob: SummaryJobService,
    private readonly mailJob: MailJobService,
  ) {}

  /**
   * 예약 작업(수집 · AI 요약 · 메일)을 등록합니다. 관리자가 바꿔 둔 시간이 DB에 있으면 그 값을 씁니다 (#21).
   * 데코레이터(@Cron)는 시간이 코드에 박혀 바꿀 수 없어, 세 작업 모두 직접 등록합니다
   */
  async onApplicationBootstrap() {
    await this.jobRuns
      .closeInterruptedRuns()
      .catch((error) =>
        this.logger.warn(`중단된 작업 기록 정리 실패: ${error.message}`),
      );
    const schedule = await this.scheduleConfig.load();
    const add = (name: string, cronTime: string, onTick: () => Promise<void>) =>
      this.schedulerRegistry.addCronJob(
        name,
        CronJob.from({ cronTime, timeZone: KST, onTick, start: this.autoRun }),
      );
    add(CRAWL_JOB_NAME, crawlCron(schedule.crawl), () => this.startCrawling());
    add(SUMMARY_JOB_NAME, dailyCron(schedule.summary), () =>
      this.summaryJob.makeAiSummary(),
    );
    const { hour, minute, day } = schedule.mail;
    add(MAIL_JOB_NAME, mailCron(hour, day, minute), () =>
      this.mailJob.sendEmailSummary(),
    );
    this.logger.log(`예약 시간: ${JSON.stringify(schedule)} (${KST})`);
  }

  /**
   * 예약 시간 바꾸기 (#21). 순서 검사 · 저장은 ScheduleConfigService, 여기서는 세 작업을 바로 다시 건다
   */
  async setSchedule(next: Schedule) {
    await this.scheduleConfig.save(next);
    this.reschedule(CRAWL_JOB_NAME, crawlCron(next.crawl));
    this.reschedule(SUMMARY_JOB_NAME, dailyCron(next.summary));
    this.reschedule(
      MAIL_JOB_NAME,
      mailCron(next.mail.hour, next.mail.day, next.mail.minute),
    );
    this.logger.log(`예약 시간 변경: ${JSON.stringify(next)} (${KST})`);
    return this.scheduleConfig.getSchedule();
  }

  private reschedule(name: string, cronTime: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    job.setTime(new CronTime(cronTime, KST));
    if (this.autoRun) job.start();
  }

  async startCrawling() {
    if (!this.isCrawlingEnabled) {
      this.logger.log('크롤링 스케줄러가 비활성화되었습니다.');
      this.jobRuns.finishRun(
        'crawling',
        'skipped',
        '스케줄러가 꺼져 있어 건너뜀',
      );
      return;
    }

    this.logger.debug(`크롤링 스케줄러가 활성화되었습니다.`);
    this.jobRuns.startRun('crawling');
    try {
      const created = await this.crawlingService.crawling();
      this.jobRuns.finishRun(
        'crawling',
        'success',
        `기사 ${created?.length ?? 0}건 수집`,
      );
    } catch (error) {
      this.jobRuns.finishRun('crawling', 'failed', error.message);
      throw error;
    }
  }

  toggleCrawlingScheduler(enable: boolean) {
    this.isCrawlingEnabled = Boolean(enable);
    this.logger.debug(this.isCrawlingEnabled ? '활성화' : '비활성화');
  }

  getSchedulerStatus() {
    return {
      autoRun: this.autoRun,
      crawling: this.isCrawlingEnabled,
      aiSummary: this.summaryJob.enabled,
      mailing: this.mailJob.enabled,
      mailSendCycle: this.getMailSendCycle(),
      runs: this.jobRuns.getRuns(),
    };
  }

  /** 메일 발송 주기 변경. DB에 저장해 재시작 후에도 유지합니다. hour: 0~23(그 시각 40분), day: 0(일)~6(토), 7: 매일 */
  async setMailSendCycle(hour: number, day: number) {
    const schedule = this.scheduleConfig.getSchedule();
    await this.setSchedule({
      ...schedule,
      mail: { ...schedule.mail, hour, day },
    });
    return this.getMailSendCycle();
  }

  async manualStartAiSummary(
    at?: Date,
    categoryId?: number,
    replaceId?: number,
  ) {
    this.logger.debug(
      at ? 'AI 요약 수동 시작 (지난 날짜)' : 'AI 요약 수동 시작',
    );
    this.jobRuns.markManual('summary');
    try {
      await this.summaryJob.makeAiSummary(at, categoryId, replaceId); // 직접 메서드 호출
    } catch (error) {
      this.logger.error(`수동 AI 요약 실패: ${error.message}`);
    }
  }
  async manualStartMailSend() {
    this.logger.debug('메일 발송 수동 시작');
    this.jobRuns.markManual('mail');
    try {
      await this.mailJob.sendEmailSummary(); // 직접 메서드 호출
    } catch (error) {
      this.logger.error(`수동 메일 발송 실패: ${error.message}`);
    }
  }

  async manualStartCrawling() {
    this.logger.debug('크롤링 수동 시작');
    this.jobRuns.markManual('crawling');
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
