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

/** 네이버 기사 시각과 같은 꼴의 KST 시각 'YYYY-MM-DD HH:mm:ss' (문자열로 크기를 비교할 수 있다) */
export function kstStamp(input: Date): string {
  return dayjs(input).tz(KST).format('YYYY-MM-DD HH:mm:ss');
}

/** KST 날짜를 '10월 31일'로 */
export function kstDayLabel(input: Date = new Date()): string {
  const day = dayjs(input).tz(KST);
  return `${day.month() + 1}월 ${day.date()}일`;
}

/** 오늘(KST)로부터 days일 전 날짜 'YYYY-MM-DD' */
export function kstDaysAgo(days: number, now: Date = new Date()): string {
  return dayjs(now).tz(KST).subtract(days, 'day').format('YYYY-MM-DD');
}

/** KST 날짜 from부터 to까지 하루씩 'YYYY-MM-DD' (둘 다 포함) */
export function kstDays(from: string, to: string): string[] {
  const days: string[] = [];
  for (
    let day = dayjs.tz(from, KST);
    !day.isAfter(dayjs.tz(to, KST), 'day');
    day = day.add(1, 'day')
  ) {
    days.push(day.format('YYYY-MM-DD'));
  }
  return days;
}

/** 이번 달(KST) 1일 00:00 · 오늘이 며칠째인지 · 이 달이 며칠인지 */
export function kstMonth(now: Date = new Date()) {
  const today = dayjs(now).tz(KST);
  return {
    month: today.format('YYYY-MM'),
    start: today.startOf('month').toDate(),
    elapsedDays: today.date(),
    daysInMonth: today.daysInMonth(),
  };
}
