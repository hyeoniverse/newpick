import type { ClockTime } from '@newpick/shared';
import dayjs from 'dayjs';
import { KST } from 'src/common/kst';

/**
 * 오늘(KST) 예약 시각이 이미 지났으면 그 시각, 아니면 null (#341 놓친 실행 따라잡기).
 * day: 메일 요일 (0 일 ~ 6 토, 7 매일). 오늘이 그 요일이 아니면 null
 */
export function passedToday(time: ClockTime, now: Date, day?: number): Date | null {
	const today = dayjs(now).tz(KST);
	if (day !== undefined && day !== 7 && today.day() !== day) return null;
	const at = today.hour(time.hour).minute(time.minute).second(0).millisecond(0);
	return at.isAfter(today) ? null : at.toDate();
}
