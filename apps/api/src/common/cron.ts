import type { ClockTime } from '@newpick/shared';

/**
 * cron 식 만들기 (초 분 시 일 월 요일). 예약 작업은 모두 KST로 등록한다 (common/kst).
 * 시각을 글자로 박지 않고 여기 함수로 만들어, 관리자 화면에서 바꾼 시각과 같은 모양을 쓴다.
 */

/** 매일 발송을 뜻하는 요일 값 (#55). 0(일)~6(토)은 그 요일 */
export const EVERY_DAY = 7;

/** 매일 hour:minute */
export const dailyCron = ({ hour, minute }: ClockTime) =>
  `0 ${minute} ${hour} * * *`;

/** 기사 수집 간격 (시간). 섹션 헤드라인은 그 순간 것만 보여 주므로, 매시간 모아 '그날의 뉴스'를 빠짐없이 채운다 (요약 전 마지막 수집은 08:00) */
export const CRAWL_EVERY_HOURS = 1;

/** 수집 시각부터 CRAWL_EVERY_HOURS마다 (1시간이면 매시 정각, 수집 분은 그대로) */
export const crawlCron = ({ hour, minute }: ClockTime) => {
  const hours = Array.from(
    { length: 24 / CRAWL_EVERY_HOURS },
    (_, i) => (hour + i * CRAWL_EVERY_HOURS) % 24,
  ).sort((a, b) => a - b);
  return `0 ${minute} ${hours.join(',')} * * *`;
};

/**
 * 메일 발송. day: 0(일)~6(토), EVERY_DAY면 매일.
 * 기본 40분: 뉴스레터 생성(매일 08:30)이 끝난 뒤에 나가도록 (#55)
 */
export const mailCron = (hour: number, day: number, minute = 40) =>
  `0 ${minute} ${hour} * * ${day === EVERY_DAY ? '*' : day}`;
