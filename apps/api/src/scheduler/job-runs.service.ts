import type { JobName, JobResult, JobRun, JobTrigger } from '@newpick/shared';
import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { errorMessage } from 'src/common/error-message';

// 작업 이름 · 실행 상태는 @newpick/shared (웹 대시보드와 같은 타입)
export type { JobName, JobRun, JobTrigger };

const emptyRun = (): JobRun => ({
	running: false,
	trigger: null,
	startedAt: null,
	finishedAt: null,
	status: null,
	message: null,
});

/**
 * 예약 작업(수집 · AI 요약 · 메일)의 실행 기록 (#21): 작업별 마지막 실행(대시보드 · 상태), DB jobRun 한 줄씩.
 * 세 작업이 시작 · 끝날 때 부른다
 */
@Injectable()
export class JobRunsService {
	private readonly runs: Record<JobName, JobRun> = {
		crawling: emptyRun(),
		summary: emptyRun(),
		mail: emptyRun(),
	};
	/** 다음 실행이 관리자의 '지금 실행'인지 (예약 실행이 기본) */
	private readonly nextTrigger: Partial<Record<JobName, JobTrigger>> = {};
	/** 진행 중인 실행의 DB 기록 id (끝날 때 같은 줄을 고친다) */
	private readonly runRecord: Partial<Record<JobName, Promise<number | null>>> = {};

	private readonly logger = new Logger(JobRunsService.name);

	constructor(private readonly prisma: MysqlPrismaService) {}

	/**
	 * 서버가 다시 시작되면 진행 중이던 작업은 이미 멈췄다. DB에 '진행 중'으로 남은 기록을 실패로 닫는다
	 * (그대로 두면 대시보드가 계속 진행 중으로 보고 '지금 실행'을 막았다. 배포 중에 요약이 돌면 생긴다)
	 */
	async closeInterruptedRuns() {
		const { count } = await this.prisma.jobRun.updateMany({
			where: { status: 'running' },
			data: {
				status: 'failed',
				finishedAt: new Date(),
				message: '서버가 다시 시작되어 중단되었습니다.',
			},
		});
		if (count) this.logger.warn(`중단된 작업 기록 ${count}건을 실패로 닫음`);
	}

	/** 작업별 마지막 실행 (복사본) */
	getRuns(): Record<JobName, JobRun> {
		return {
			crawling: { ...this.runs.crawling },
			summary: { ...this.runs.summary },
			mail: { ...this.runs.mail },
		};
	}

	/** 다음 실행을 관리자의 '지금 실행'으로 남긴다 */
	markManual(name: JobName) {
		this.nextTrigger[name] = 'manual';
	}

	/** 이번 실행이 예약인지 '지금 실행'인지 (한 번 쓰면 비운다) */
	private takeTrigger(name: JobName): JobTrigger {
		const trigger = this.nextTrigger[name] ?? 'schedule';
		delete this.nextTrigger[name];
		return trigger;
	}

	startRun(name: JobName) {
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

	finishRun(name: JobName, status: JobResult, message: string) {
		const run = this.runs[name];
		const finishedAt = new Date();
		// 꺼져 있어 바로 건너뛴 경우는 시작 시각도 지금
		const startedAt = run.running && run.startedAt ? new Date(run.startedAt) : finishedAt;
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
				this.logger.warn(`실행 기록 실패 (${name}): ${errorMessage(error)}`);
			}
		})();
	}
}
