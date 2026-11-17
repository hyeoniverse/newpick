import type { Schedule } from '@newpick/shared';
import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { AppException } from 'src/common/errors/app.exception';
import { DEFAULT_SCHEDULE, minutesOf } from './schedule';

/** schedule_configs에서 메일 발송 주기를 저장하는 행 */
const MAIL_CYCLE_CONFIG_ID = 1;

/** 예약 시각 (#21): 관리자가 바꿔 둔 값을 DB에서 읽고, 순서를 검사해 저장한다. cron을 다시 거는 것은 SchedulerService */
@Injectable()
export class ScheduleConfigService {
	private schedule: Schedule = DEFAULT_SCHEDULE;

	constructor(private readonly prisma: MysqlPrismaService) {}

	/** 서버가 시작할 때: 저장한 값이 있으면 그 값으로 */
	async load() {
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
		return this.getSchedule();
	}

	getSchedule(): Schedule {
		return structuredClone(this.schedule);
	}

	/**
	 * 예약 시간 바꾸기 (#21). 수집 → AI 요약 → 메일 순서여야 한다:
	 * 요약은 그날 수집한 기사로, 메일은 그날 요약으로 만든다. DB에 저장한다
	 */
	async save(next: Schedule) {
		const [crawl, summary, mail] = [next.crawl, next.summary, next.mail].map(minutesOf);
		if (!(crawl < summary && summary < mail)) {
			throw new AppException(
				'BAD_REQUEST',
				'기사 수집 → AI 요약 → 구독 메일 순서로, 앞 작업보다 늦은 시각을 선택해 주십시오.',
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
		return this.getSchedule();
	}
}
