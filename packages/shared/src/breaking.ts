/** 속보 후보 (관리자 › 속보, GET /admin/breaking). 매시 수집 뒤 판정하고, 관리자가 확인한 뒤에만 보낸다 */

export type BreakingStatus = 'pending' | 'approved' | 'rejected' | 'sent';

export interface BreakingArticle {
  title: string;
  link: string;
  source: string;
}

export interface BreakingAlert {
  id: number;
  status: BreakingStatus;
  /** 속보 점수 1~10 (9 이상만 후보로 남는다) */
  score: number;
  /** 사건 한 줄 */
  headline: string;
  /** 왜 속보인지 */
  reason: string;
  articles: BreakingArticle[];
  /** ISO 시각 */
  detectedAt: string;
  decidedAt: string | null;
}
