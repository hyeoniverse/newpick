import type { JobName, JobRun } from './jobs';
import type { Schedule } from './schedule';

/** 관리자 대시보드 (GET /scheduler/dashboard): 기간 안의 수집 · 발행 · AI 비용 · 발송과 예약 작업 상태 */
export interface Dashboard {
  range: { from: string; to: string };
  scheduler: {
    /** false면 이 서버는 예약 시각에 저절로 돌지 않는다 ('지금 실행'만) */
    autoRun?: boolean;
    enabled: Record<JobName, boolean>;
    schedule: Schedule;
    runs: Record<JobName, JobRun>;
  };
  crawling: { count: number; latestAt: string | null };
  newsletters: {
    total: number;
    items: {
      id: number;
      title: string;
      categoryId: number;
      createdAt: string;
    }[];
  };
  aiCost: { total: number; unknown: number };
  summaryLogs: {
    total: number;
    items: {
      id: number;
      processType: string;
      status: string;
      duration: number;
      token: number;
      createdAt: string;
      result: string | null;
      error: string | null;
      model: string | null;
      inputTokens: number;
      outputTokens: number;
      costUsd: number | null;
    }[];
  };
  mail: {
    activeSubscribers: number;
    byDay: { day: string; recipients: number }[];
  };
}
