/** 예약 시각 (KST) */
export interface ClockTime {
  hour: number;
  minute: number;
}

/** 작업 예약 시각 (GET /scheduler/schedule): 수집 → AI 요약 → 메일(요일: 0 일 ~ 6 토, 7 매일) */
export interface Schedule {
  crawl: ClockTime;
  summary: ClockTime;
  mail: ClockTime & { day: number };
}

/**
 * 지난 날짜를 다시 만들 수 있는 가장 오래된 날 (오늘부터 며칠 전까지). 모은 기사는 MongoDB TTL 30일이고 그날의 재료는
 * 전날 아침부터라, 29일 전 날은 재료 앞쪽이 이미 지워졌을 수 있어 28일. api 검사와 관리자 '빠진 날' 화면이 같이 쓴다
 */
export const BACKFILL_MAX_DAYS = 28;
