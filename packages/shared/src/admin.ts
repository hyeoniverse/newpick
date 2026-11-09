/** 관리자 목록 응답 (#31): 각 GET의 data. 날짜는 ISO 문자열 */
import type { UserRole } from './me';

/** 쪽 단위 목록 */
export interface Paged<T> {
  items: T[];
  total: number;
}

/** 사용자 한 줄 (GET /admin/users) */
export interface AdminUserRow {
  id: number;
  email: string;
  username: string | null;
  role: UserRole;
  createdAt: string;
  interests: number[];
  /** 구독 상태 (구독한 적 없으면 null) */
  subscription: string | null;
  bookmarks: number;
}

/** 구독자 한 줄 (GET /admin/subscribers) */
export interface AdminSubscriberRow {
  id: number;
  status: string;
  startedAt: string;
  endAt: string | null;
  userId: number;
  email: string;
  username: string | null;
  interests: number[];
}

/** 구독자 목록: + 상태별 수 */
export interface AdminSubscriberPage extends Paged<AdminSubscriberRow> {
  byStatus: Record<string, number>;
}

/** 수집 기사 한 줄 (GET /scheduler/dashboard/articles) */
export interface AdminArticleRow {
  id: string;
  title: string;
  link: string;
  source: string;
  category: string[];
  publishedAt: string | null;
  createdAt: string;
  image: string | null;
  /** 이 기사를 쓴 뉴스레터 */
  usedIn: { id: number; title: string }[];
}

/** 수집 기사 목록: + 언론사 목록 (거르기) */
export interface AdminArticlePage extends Paged<AdminArticleRow> {
  sources: string[];
}

/** 발송 한 줄 (GET /scheduler/dashboard/mails) */
export interface AdminMailRow {
  day: string;
  email: string;
  sentAt: string;
  categoryIds: number[];
}

/** AI 기록 한 줄 (GET /scheduler/dashboard/ai-logs) */
export interface AiLogRow {
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
  /** 요약한 분야 (이전 기록은 없음) */
  category: string | null;
  categoryId: number | null;
  /** 같은 분야 시도 묶음 (12시간 안에 이어진 다시 시도): n번째 시도 / 모두 total번, 묶음이 어떻게 끝났는지, 묶음 열쇠 */
  attempt: { n: number; total: number; outcome: string; chain: number } | null;
}

/** AI 기록 목록: + 그 조건의 비용 합계 (비용을 모르는 기록 수) */
export interface AiLogPage extends Paged<AiLogRow> {
  cost: { total: number; unknown: number };
}

/** 관심사 현황 한 줄 (GET /admin/categories) */
export interface AdminCategoryRow {
  id: number;
  name: string;
  newsletters: number;
  lastNewsletterAt: string | null;
  interestedUsers: number;
  activeSubscribers: number;
  articles30d: number;
}

/** 태그 규칙 (GET /admin/tags/rules): alias는 keyword를 target으로 바꿔 쓰고, block은 쓰지 않는다 */
export interface TagRule {
  id: number;
  keyword: string;
  action: 'alias' | 'block';
  target: string | null;
  createdAt: string;
}

/** 클릭 한 점: [가로 비율, 세로 비율, 누른 요소 이름] */
export type HeatmapClick = [number, number, string?];

/** 화면 하나의 체류 · 스크롤 · 클릭 (GET /scheduler/stats/page) */
export interface PageStats {
  route: string;
  device: 'desktop' | 'tablet' | 'mobile';
  views: number;
  samplePath: string | null;
  avgMs: number;
  avgScroll: number;
  sections: { name: string; avgMs: number; totalMs: number; reach: number }[];
  attention: number[];
  clicks: HeatmapClick[];
}

/** 관리자가 받는 메일 주소 한 줄 (GET /scheduler/dashboard/mail?date=) */
export interface MailRecipient {
  email: string;
  sentAt: string;
  categoryIds: number[];
}
