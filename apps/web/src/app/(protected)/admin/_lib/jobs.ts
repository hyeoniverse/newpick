import { ADMIN } from '@/copy';
import type { ClockTime, JobName, JobStatus, Schedule } from '@newpick/shared';
import { pad2 } from '@/utils/formatter';

/* 예약 작업 이름 · 결과 이름표 · 시각 문구 (#198): 대시보드 · 실행 기록 화면이 같이 쓴다 */

/** 작업 이름 (화면에 보이는 순서: 기사 수집 → AI 요약 → 구독 메일) */
export const JOB_LABEL: Record<JobName, string> = { crawling: '기사 수집', summary: 'AI 요약', mail: '구독 메일' };

/** 지금 실행 전 확인 문구 */
export const JOB_WARNING: Record<JobName, string> = {
	crawling: ADMIN.jobs.crawlWarning,
	summary: ADMIN.jobs.summaryWarning,
	mail: ADMIN.jobs.mailWarning,
};

/** 실행 결과 (도는 중 포함) */
export const RUN_STATUS_LABEL: Record<JobStatus, string> = {
	running: '진행 중',
	success: '성공',
	partial: '일부 실패',
	failed: '실패',
	skipped: '건너뜀',
};

/** 요일 (0 = 일요일). 7은 매일 */
export const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** '08:40' */
export const clock = ({ hour, minute }: ClockTime) => `${pad2(hour)}:${pad2(minute)}`;

/** '매일 08:40' · '매주 월요일 08:40' */
export const describe = (time: ClockTime, day = 7) =>
	day === 7 ? `매일 ${clock(time)}` : `매주 ${DAYS[day]}요일 ${clock(time)}`;

/** 작업마다 언제 도는지: '매시 00분' · '매일 08:30' · '매주 월요일 08:40' */
export const scheduleText = (job: JobName, schedule: Schedule) =>
	job === 'crawling'
		? `매시 ${pad2(schedule.crawl.minute)}분`
		: job === 'summary'
			? describe(schedule.summary)
			: describe(schedule.mail, schedule.mail.day);
