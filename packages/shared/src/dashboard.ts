import type { JobName, JobRun } from './jobs';
import type { Schedule } from './schedule';

/** AI 요약 자동 재시도 예정 */
export interface SummaryRetry {
  /** 다시 시도할 시각 (ISO) */
  at: string;
  /** 그 뉴스레터의 날 (KST, 지난 날짜 다시 만들기면 그날) */
  day: string;
  /** 다시 만들 관심사 이름 */
  categories: string[];
  /** 몇 번째 자동 재시도인가 (1부터) */
  attempt: number;
}

/** 관리자 대시보드 (GET /scheduler/dashboard): 기간 안의 수집 · 발행 · AI 비용 · 발송과 예약 작업 상태 */
export interface Dashboard {
  range: { from: string; to: string };
  scheduler: {
    /** false면 이 서버는 예약 시각에 저절로 돌지 않는다 ('지금 실행'만) */
    autoRun?: boolean;
    enabled: Record<JobName, boolean>;
    schedule: Schedule;
    runs: Record<JobName, JobRun>;
    /**
     * AI 요약에서 실패한 관심사의 다음 자동 재시도 (없으면 null). 작업이 끝난 뒤 5 · 10 · 20 · 30분, 그 뒤로 1시간마다 그날 안에서.
     * 이전 api는 보내지 않으므로 없을 수 있다
     */
    summaryRetry?: SummaryRetry | null;
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
    /** 기간 동안 받은 서로 다른 사람 수 (날짜별 recipients를 더한 것이 아님) */
    recipients: number;
    /** 날짜별 받은 사람 수. 더하면 보낸 메일 수(사람 × 날) */
    byDay: { day: string; recipients: number }[];
  };
}
