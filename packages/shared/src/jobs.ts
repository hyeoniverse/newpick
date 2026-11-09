/**
 * 예약 작업 (#21 관리자 대시보드): 기사 수집 → AI 요약 → 구독 메일.
 * DB job_runs의 job · trigger · status 값과 같다
 */
export const JOB_NAMES = ['crawling', 'summary', 'mail'] as const;
export type JobName = (typeof JOB_NAMES)[number];

/** 작업마다 api 주소 조각: 켜기 · 끄기(POST /scheduler/toggle/…) · 지금 실행(POST /scheduler/manual/…) */
export const JOB_ENDPOINT = {
  crawling: 'crawling',
  summary: 'ai-summary',
  mail: 'mail-send',
} as const satisfies Record<JobName, string>;
export type JobEndpoint = (typeof JOB_ENDPOINT)[JobName];

/** schedule: 예약 시각에 · manual: 관리자가 지금 실행 */
export type JobTrigger = 'schedule' | 'manual';

/** 끝난 실행의 결과. success: 다 됨 · partial: 일부 실패 · failed: 실패 · skipped: 꺼져 있거나 할 일이 없어 건너뜀 */
export const JOB_RESULTS = ['success', 'partial', 'failed', 'skipped'] as const;
export type JobResult = (typeof JOB_RESULTS)[number];
/** 실행 기록의 상태 (도는 중이면 running) */
export type JobStatus = 'running' | JobResult;

/** 작업의 지금 상태 · 마지막 실행 (대시보드). 실행한 적이 없으면 값이 비어 있다 */
export interface JobRun {
  running: boolean;
  trigger: JobTrigger | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: JobResult | null;
  message: string | null;
}

/** 실행 기록 한 줄 (GET /scheduler/dashboard/job-runs, DB job_runs) */
export interface JobRunRecord {
  id: number;
  job: JobName;
  trigger: JobTrigger;
  status: JobStatus;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
}
