/**
 * 속보 (관리자 › 속보 GET /admin/breaking, 홈 속보 띠 GET /breaking/latest, 지난 속보 GET /breaking · /breaking/:id).
 * 매시 수집 뒤 판정해 '발송 예정'으로 두고, 취소할 시간(5분)이 지나면 저절로 나간다(메일 · 홈 · 사이트). 그 사이 관리자가 '보내지 않기'로 막을 수 있다
 */

/** scheduled 발송 예정 · held 보류(자동 발송 꺼짐 · 하루 상한) · canceled 미발행 · sent 메일 보냄 */
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
  /** 메일을 보낸 때와 받은 사람 수 (밤에 미룬 사람은 아침에 더한다) */
  sentAt: string | null;
  recipients: number;
  /** 밤에 나가, 밤에 받지 않기로 한 사람에게는 아침 7시에 보낼 차례 */
  nightPending: boolean;
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

/** 지난 속보 (사이트 /breaking): 나간 속보. 메일의 '사이트에서 보기'도 여기로 */
export type BreakingArchiveItem = BreakingNotice;

/** 마이페이지 › 설정 › 속보 메일 */
export interface BreakingMailSettings {
  /** 속보 메일 받기 (기본 켜짐, 구독 중일 때만 보낸다) */
  enabled: boolean;
  /** 밤(22시~7시)에도 바로 받기. 끄면(기본) 아침 7시에 받는다 */
  night: boolean;
}
