/**
 * 속보 (관리자 › 속보 GET /admin/breaking, 홈 속보 띠 GET /breaking/latest).
 * 매시 수집 뒤 판정해 '발송 예정'으로 두고, 취소할 시간(5분)이 지나면 저절로 나간다. 그 사이 관리자가 '보내지 않기'로 막을 수 있다
 */

/** scheduled 발송 예정 · held 보류(자동 발송 꺼짐 · 하루 상한) · canceled 보내지 않음 · sent 발송함 */
export type BreakingStatus = 'scheduled' | 'held' | 'canceled' | 'sent';

export interface BreakingArticle {
  title: string;
  link: string;
  source: string;
  /** 기사 대표 사진 (수집할 때 모은 것, 없으면 빠짐) */
  image?: string;
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
  /** 보낼 시각 (발송 예정일 때) */
  sendAt: string | null;
  decidedAt: string | null;
}

/** 관리자 › 속보 화면: 후보 + 자동 발송 스위치 */
export interface BreakingAdminView {
  /** 자동 발송 켜짐 (끄면 새 후보는 보류) */
  auto: boolean;
  /** 하루에 저절로 보내는 최대 수 */
  dailyLimit: number;
  /** 취소할 수 있는 시간 (분) */
  holdMinutes: number;
  alerts: BreakingAlert[];
}

/** 홈 속보 띠: 나간 속보 (취소할 시간이 지났거나 발송함, 24시간 안) */
export type BreakingNotice = Pick<BreakingAlert, 'id' | 'headline' | 'reason' | 'articles' | 'detectedAt'> & {
  /** 홈 큰 속보 칸의 사진: 관련 기사 가운데 사진이 있는 첫 기사의 것 (없으면 null) */
  image: string | null;
};
