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
