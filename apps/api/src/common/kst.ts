import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/** 서비스 기준 시간대. 서버의 TZ 설정과 관계없이 날짜 계산은 이 시간대로 합니다. */
export const KST = 'Asia/Seoul';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** 'YYYY-MM-DD'는 그대로, 시각이 있는 값은 KST 기준 날짜로 바꿉니다. */
export function toKstDate(input: string | Date): string {
  if (typeof input === 'string' && DATE_ONLY.test(input)) return input;
  return dayjs(input).tz(KST).format('YYYY-MM-DD');
}

/** KST 기준 하루 단위 범위 [dateStart 00:00, dateEnd 23:59:59.999] */
export function kstDayRange(dateStart: string | Date, dateEnd: string | Date) {
  return {
    start: dayjs.tz(toKstDate(dateStart), KST).startOf('day').toDate(),
    end: dayjs.tz(toKstDate(dateEnd), KST).endOf('day').toDate(),
  };
}

/** 오늘(KST)로부터 days일 전 날짜 'YYYY-MM-DD' */
export function kstDaysAgo(days: number, now: Date = new Date()): string {
  return dayjs(now).tz(KST).subtract(days, 'day').format('YYYY-MM-DD');
}
