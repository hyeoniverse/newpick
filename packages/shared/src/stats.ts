import type { JobResult } from "./jobs";

/**
 * 관리자 통계 응답 (#122): GET /scheduler/stats/* 의 data. 날짜는 'YYYY-MM-DD'(KST) 문자열, 금액은 USD.
 * api의 통계 함수가 이 타입을 돌려주도록 묶여 있어(반환 타입), 한쪽만 바꾸면 타입 오류가 난다
 */

/** 통계를 낸 기간 (KST 날짜) */
export interface StatsRange {
  from: string;
  to: string;
}

/** 예약 작업 결과별 횟수 */
export type JobRunCounts = Record<JobResult, number>;

export interface SubscriberStats {
  range: StatsRange;
  since: string | null;
  days: {
    date: string;
    subscribe: number;
    resume: number;
    pause: number;
    cancel: number;
    active: number;
  }[];
  totals: {
    subscribe: number;
    resume: number;
    pause: number;
    cancel: number;
    activeStart: number;
    activeEnd: number;
  };
  active: number;
  byCategory: { id: number; name: string; active: number }[];
}

export interface CostStats {
  range: StatsRange;
  total: number;
  count: number;
  unknown: number;
  failed: number;
  newsletters: number;
  perNewsletter: number | null;
  days: { date: string; cost: number }[];
  byType: { key: string; cost: number; count: number }[];
  byModel: { key: string; cost: number }[];
  byStage: { key: string; cost: number }[];
  byCategory: { id: number | null; name: string | null; cost: number }[];
  month: {
    month: string;
    toDate: number;
    projected: number;
    elapsedDays: number;
    daysInMonth: number;
  };
}

export interface TrafficStats {
  range: StatsRange;
  totals: {
    sessions: number;
    views: number;
    avgMs: number;
    viewsPerSession: number;
  };
  days: { date: string; sessions: number; views: number }[];
  channels: { key: string; sessions: number }[];
  referrers: { key: string; sessions: number }[];
  campaigns: { key: string; sessions: number }[];
  entryPages: { key: string; sessions: number }[];
  devices: { key: string; sessions: number }[];
  pages: {
    route: string;
    views: number;
    sessions: number;
    avgMs: number;
    avgScroll: number;
  }[];
}

export interface TasteStats {
  weights: { bookmark: number; scrap: number; memo: number };
  /** 별표한 스크랩에 더 얹는 점수 */
  starBonus: number;
  halfLifeDays: number;
  users: number;
  signals: { bookmark: number; scrap: number; memo: number };
  topics: { topic: string; score: number; users: number }[];
  categories: { categoryId: number; name: string | null; score: number }[];
}

export interface DeliveryStats {
  range: StatsRange;
  days: {
    date: string;
    recipients: number;
    mails: number;
    runs: JobRunCounts;
  }[];
  totals: { recipients: number; mails: number; runs: JobRunCounts };
  views: {
    total: number;
    byCategory: {
      id: number;
      name: string;
      views: number;
      newsletters: number;
    }[];
    top: {
      id: number;
      title: string;
      category: string | null;
      viewcount: number;
    }[];
  };
}
