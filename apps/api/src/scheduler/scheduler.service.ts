import type { Schedule } from '@newpick/shared';
import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, CronTime } from 'cron';
import { crawlCron, dailyCron, mailCron } from 'src/common/cron';
import { KST } from 'src/common/kst';
import { CrawlingService } from 'src/crawling/crawling.service';
import { BreakingService } from 'src/breaking/breaking.service';
import { BreakingSendService } from 'src/breaking/breaking-send.service';
import { PipelineLiveService } from 'src/pipeline/pipeline-live.service';
import { env } from 'src/config/env';
import { JobRunsService } from './job-runs.service';
import { MailJobService } from './mail-job.service';
import { ScheduleConfigService } from './schedule-config.service';
import { SummaryJobService } from './summary-job.service';
import { errorMessage } from 'src/common/error-message';
import { FallbackImagesService } from 'src/ai-summary/fallback-images.service';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { passedToday } from './catch-up';

const MAIL_JOB_NAME = 'sendNewsletter';
const CRAWL_JOB_NAME = 'startCrawling';
const SUMMARY_JOB_NAME = 'makeAiSummary';
/** 속보 메일: 1분마다 보낼 차례가 된 속보를 보낸다 (시각을 바꾸는 작업이 아니라 늘 같음) */
const BREAKING_JOB_NAME = 'sendBreaking';
const EVERY_MINUTE = '* * * * *';

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

	private readonly logger = new Logger(SchedulerService.name);

	constructor(
		private readonly crawlingService: CrawlingService,
		private schedulerRegistry: SchedulerRegistry,
		private readonly scheduleConfig: ScheduleConfigService,
		private readonly jobRuns: JobRunsService,
		private readonly summaryJob: SummaryJobService,
		private readonly mailJob: MailJobService,
		private readonly fallbackImages: FallbackImagesService,
		private readonly prisma: MysqlPrismaService,
		private readonly breaking: BreakingService,
		private readonly breakingSend: BreakingSendService,
		/** 홈 '지금 뉴픽은': 수집 과정 · 다음 예약 시각 */
		@Optional() private readonly pipeline?: PipelineLiveService,
	) {}

	/**
	 * 예약 작업(수집 · AI 요약 · 메일)을 등록합니다. 관리자가 바꿔 둔 시간이 DB에 있으면 그 값을 씁니다 (#21).
	 * 데코레이터(@Cron)는 시간이 코드에 박혀 바꿀 수 없어, 세 작업 모두 직접 등록합니다
	 */
	async onApplicationBootstrap() {
		await this.jobRuns
			.closeInterruptedRuns()
			.catch((error) => this.logger.warn(`중단된 작업 기록 정리 실패: ${error.message}`));
		const schedule = await this.scheduleConfig.load();
		const add = (name: string, cronTime: string, onTick: () => Promise<void>) =>
			this.schedulerRegistry.addCronJob(name, CronJob.from({ cronTime, timeZone: KST, onTick, start: this.autoRun }));
		add(CRAWL_JOB_NAME, crawlCron(schedule.crawl), () => this.startCrawling());
		add(SUMMARY_JOB_NAME, dailyCron(schedule.summary), () => this.summaryJob.makeAiSummary());
		const { hour, minute, day } = schedule.mail;
		add(MAIL_JOB_NAME, mailCron(hour, day, minute), () => this.mailJob.sendEmailSummary());
		add(BREAKING_JOB_NAME, EVERY_MINUTE, () => this.breakingSend.tick());
		this.logger.log(`예약 시간: ${JSON.stringify(schedule)} (${KST})`);
		this.pipeline?.setNextTimes(() => ({
			crawl: this.nextRun(CRAWL_JOB_NAME),
			summary: this.nextRun(SUMMARY_JOB_NAME),
		}));
		// 부팅을 막지 않게 뒤에서 (배포 상태 확인이 기다린다)
		if (this.autoRun)
			void this.catchUp(schedule).catch((error) =>
				this.logger.error(`놓친 실행 따라잡기 실패: ${errorMessage(error)}`),
			);
	}

	/**
	 * 놓친 실행 따라잡기 (#341): cron은 꺼져 있던 동안의 예약 시각을 다시 돌리지 않아, 배포 · 재시작이 예약 시각과 겹치면
	 * 그날 요약 · 메일이 통째로 빠졌다. 오늘(KST) 예약 시각이 지났는데 그 뒤 실행 기록이 없으면 지금 돌린다.
	 * - 요약: 실패로 끝난 기록(재시작으로 중단 포함)만 있어도 다시 돈다. 이미 만든 분야는 건너뛰어 두 번 만들지 않는다
	 * - 메일: 기록이 하나도 없을 때만. 보내다 끊긴 경우는 관리자가 확인하고 '지금 실행'(오늘 받은 사람은 건너뜀)
	 * - 요약을 먼저 끝내고 메일 (메일이 요약을 기다리기도 한다)
	 */
	async catchUp(schedule: Schedule, now = new Date()) {
		const summaryAt = passedToday(schedule.summary, now);
		if (summaryAt && !(await this.ranSince('summary', summaryAt, { ignoreFailed: true }))) {
			this.logger.warn('오늘 AI 요약을 놓쳐 지금 실행합니다.');
			this.jobRuns.markTrigger('summary', 'catchup');
			await this.summaryJob.makeAiSummary();
		}
		const mailAt = passedToday(schedule.mail, now, schedule.mail.day);
		if (mailAt && !(await this.ranSince('mail', mailAt, { ignoreFailed: false }))) {
			this.logger.warn('오늘 메일 발송을 놓쳐 지금 실행합니다.');
			this.jobRuns.markTrigger('mail', 'catchup');
			await this.mailJob.sendEmailSummary();
		}
	}

	private async ranSince(job: 'summary' | 'mail', since: Date, { ignoreFailed }: { ignoreFailed: boolean }) {
		const count = await this.prisma.jobRun.count({
			where: { job, startedAt: { gte: since }, ...(ignoreFailed && { status: { not: 'failed' } }) },
		});
		return count > 0;
	}

	/**
	 * 예약 시간 바꾸기 (#21). 순서 검사 · 저장은 ScheduleConfigService, 여기서는 세 작업을 바로 다시 건다
	 */
	async setSchedule(next: Schedule) {
		await this.scheduleConfig.save(next);
		this.reschedule(CRAWL_JOB_NAME, crawlCron(next.crawl));
		this.reschedule(SUMMARY_JOB_NAME, dailyCron(next.summary));
		this.reschedule(MAIL_JOB_NAME, mailCron(next.mail.hour, next.mail.day, next.mail.minute));
		this.logger.log(`예약 시간 변경: ${JSON.stringify(next)} (${KST})`);
		return this.scheduleConfig.getSchedule();
	}

	/** 다음 예약 시각 (ISO). 예약 작업이 꺼져 있으면(로컬 등) null */
	private nextRun(name: string) {
		if (!this.autoRun) return null;
		try {
			return this.schedulerRegistry.getCronJob(name).nextDate().toJSDate().toISOString();
		} catch {
			return null;
		}
	}

	private reschedule(name: string, cronTime: string) {
		const job = this.schedulerRegistry.getCronJob(name);
		job.setTime(new CronTime(cronTime, KST));
		if (this.autoRun) job.start();
	}

	async startCrawling() {
		if (!this.isCrawlingEnabled) {
			this.logger.log('크롤링 스케줄러가 비활성화되었습니다.');
			this.jobRuns.finishRun('crawling', 'skipped', '스케줄러가 꺼져 있어 건너뜀');
			return;
		}

		this.logger.debug(`크롤링 스케줄러가 활성화되었습니다.`);
		this.jobRuns.startRun('crawling');
		this.pipeline?.begin('crawl');
		try {
			const created = await this.crawlingService.crawling();
			// 홈 '지금 뉴픽은': 분야별 건수 · 키워드 · 같은 사건 묶음 (AI 생성 호출 없음, 실패해도 수집은 성공)
			if (this.pipeline) {
				const pipeline = this.pipeline;
				pipeline.step('crawl', 'cluster', { state: 'running' });
				await pipeline
					.describe('crawl', created ?? [])
					.catch((error) => this.logger.warn(`과정 보기 실패: ${errorMessage(error)}`));
				pipeline.step('crawl', 'cluster', { state: 'done' });
				pipeline.step('crawl', 'breaking', { state: 'running' });
			}
			// 새로 모은 기사로 속보를 판정한다 (찾으면 취소할 시간 뒤 저절로 나간다). 실패해도 수집은 성공
			const breaking = await this.breaking.detect(created).catch((error) => {
				this.logger.warn(`속보 판정 실패: ${errorMessage(error)}`);
				return 0;
			});
			this.pipeline?.step('crawl', 'breaking', { state: 'done', count: breaking });
			await this.pipeline?.finish('crawl', 'done');
			this.jobRuns.finishRun(
				'crawling',
				'success',
				`기사 ${created?.length ?? 0}건 수집` + (breaking ? ` · 속보 ${breaking}건 (관리자 › 속보)` : ''),
			);
			// 수집 뒤 대체 사진이 비어 있는 뉴스레터를 조금씩 채운다. 실패해도 수집 결과에는 영향이 없다
			await this.fallbackImages
				.fillMissing()
				.catch((error) => this.logger.warn(`대체 사진 채우기 실패: ${errorMessage(error)}`));
		} catch (error) {
			this.jobRuns.finishRun('crawling', 'failed', errorMessage(error));
			await this.pipeline?.finish('crawl', 'failed');
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
			summaryRetry: this.summaryJob.getAutoRetry(),
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

	async manualStartAiSummary(at?: Date, categoryId?: number, replaceId?: number) {
		this.logger.debug(at ? 'AI 요약 수동 시작 (지난 날짜)' : 'AI 요약 수동 시작');
		this.jobRuns.markManual('summary');
		try {
			await this.summaryJob.makeAiSummary(at, categoryId, replaceId); // 직접 메서드 호출
		} catch (error) {
			this.logger.error(`수동 AI 요약 실패: ${errorMessage(error)}`);
		}
	}
	/**
	 * 날짜 하나 고쳐 채우기 (관리자 '빠진 날'): 고른 빠진 관심사를 만든 뒤, 고른 뉴스레터를 하나씩 다시 쓴다.
	 * 요약은 한 번에 하나만 돌므로 차례로 기다린다. 하나가 실패해도 나머지는 계속한다 (실행 기록은 하나씩 남는다)
	 */
	async manualFixDay(
		at: Date | undefined,
		categoryIds: number[] | undefined,
		rewrites: { id: number; at: Date; categoryId: number }[],
	) {
		try {
			if (!categoryIds || categoryIds.length) {
				this.jobRuns.markManual('summary');
				await (categoryIds ? this.summaryJob.makeCategories(at, categoryIds) : this.summaryJob.makeAiSummary(at));
			}
			for (const rewrite of rewrites) {
				this.jobRuns.markManual('summary');
				await this.summaryJob.makeAiSummary(rewrite.at, rewrite.categoryId, rewrite.id);
			}
		} catch (error) {
			this.logger.error(`빠진 날 고쳐 채우기 실패: ${errorMessage(error)}`);
		}
	}

	async manualStartMailSend() {
		this.logger.debug('메일 발송 수동 시작');
		this.jobRuns.markManual('mail');
		try {
			await this.mailJob.sendEmailSummary(); // 직접 메서드 호출
		} catch (error) {
			this.logger.error(`수동 메일 발송 실패: ${errorMessage(error)}`);
		}
	}

	async manualStartCrawling() {
		this.logger.debug('크롤링 수동 시작');
		this.jobRuns.markManual('crawling');
		try {
			await this.startCrawling(); // 직접 메서드 호출
		} catch (error) {
			this.logger.error(`수동 크롤링 실패: ${errorMessage(error)}`);
		}
	}

	getMailSendCycle(): string {
		const job = this.schedulerRegistry.getCronJob(MAIL_JOB_NAME);
		return String(job.cronTime.source);
	}
}
