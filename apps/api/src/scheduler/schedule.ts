import type { ClockTime, Schedule } from '@newpick/shared';
import { EVERY_DAY } from 'src/common/cron';
import { AppException } from 'src/common/errors/app.exception';
import { kstTimeOf, toKstDate } from 'src/common/kst';

/** 예약 시각 계산 (호출 없음). 예약 시각을 저장 · 읽는 것은 schedule-config.service */

/** 예약 작업 시간 (#21). 메일은 요일도: 0(일)~6(토), 7 매일 */
// 예약 시각 타입은 @newpick/shared (웹 시간 설정과 같다)
export type { ClockTime, Schedule };

/** 저장한 적이 없을 때: 수집 08:00 → AI 요약 08:30 → 메일 매일 08:40 */
export const DEFAULT_SCHEDULE: Schedule = {
	crawl: { hour: 8, minute: 0 },
	summary: { hour: 8, minute: 30 },
	mail: { hour: 8, minute: 40, day: EVERY_DAY },
};

/** 추천 기사 등에서 '오늘 기사'로 보는 범위 (시간) */
export const SUMMARY_WINDOW_HOURS = 24;
/** 오늘 아침 속보의 시작 시각 (KST). 이 시각부터 마지막 수집(08:00)까지 보도된 기사는 뉴스레터 맨 위에 따로 싣는다 */
export const MORNING_START_HOUR = 5;

/**
 * AI 요약에 쓰는 기사 범위: 어제 수집 시각(08:00)부터 지금까지 처음 모은 것.
 * 그 가운데 오늘 MORNING_START_HOUR 이후 보도는 '오늘 아침 속보', 나머지(어제 낮~밤)는 본문 소식
 */
export const summaryWindow = (crawl: ClockTime, now = new Date()) => ({
	start: kstTimeOf(crawl.hour, crawl.minute, now, 1),
	end: now,
	morningSince: kstTimeOf(MORNING_START_HOUR, 0, now),
});
export const minutesOf = ({ hour, minute }: ClockTime) => hour * 60 + minute;

/** 모은 기사가 남아 있는 날수 (MongoDB TTL 30일). 그보다 오래된 날은 다시 만들 재료가 없다 */
export const BACKFILL_MAX_DAYS = 29;

/**
 * 지난 날짜(YYYY-MM-DD, KST)를 다시 만들 때 그날의 발행 시각: 그날 예약된 요약 시각.
 * 오늘 · 앞날, 기사가 남아 있지 않은 날이면 거절한다
 */
export const backfillAt = (date: string, summary: ClockTime, now = new Date()): Date => {
	const today = toKstDate(now);
	if (date >= today) {
		throw new AppException('BAD_REQUEST', '지난 날짜만 다시 생성할 수 있습니다.');
	}
	const oldest = toKstDate(new Date(now.getTime() - BACKFILL_MAX_DAYS * 24 * 60 * 60 * 1000));
	if (date < oldest) {
		throw new AppException(
			'BAD_REQUEST',
			`수집한 기사는 ${BACKFILL_MAX_DAYS}일 동안만 보관하므로 ${oldest}부터 다시 생성할 수 있습니다.`,
		);
	}
	return kstTimeOf(summary.hour, summary.minute, new Date(`${date}T12:00:00+09:00`));
};
