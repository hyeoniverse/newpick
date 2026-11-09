/** 마이페이지 받은 메일 (GET /mypage/mails). 날짜는 ISO 문자열 */

/** 달 이동용: 거르기 · 정렬을 적용한 순서로 달마다 개수와 그 달 첫 항목의 순번 (스크랩 · 받은 메일) */
export interface MonthIndex {
  month: string;
  count: number;
  firstIndex: number;
}

export interface MailNewsletter {
  id: number;
  title: string;
  subtitle: string | null;
  image: string | null;
  summary: string | null;
  createdAt: string;
  category: { id: number; name: string };
}

export interface Mail {
  sentAt: string;
  /** 메일 제목 (발송 때와 같은 방식으로 다시 만든 것) */
  subject: string | null;
  newsletters: MailNewsletter[];
  starred: boolean;
  folderId: number | null;
  /** 메일의 짜임새 (발송 때처럼 고른 분야로 다시 엮은 것). 편집본 · 소식이 없으면 null */
  digest: MailDigest | null;
}

/** 받은 메일은 사이트 뉴스레터를 그대로 붙인 게 아니라, 그날 편집본으로 고른 분야만 다시 엮은 것 */
export interface MailDigest {
  /** 오늘을 한눈에: 고른 분야 전체에서 중요도 순 */
  top: { category: string; heading: string; line: string }[];
  /** 분야를 넘는 흐름 (고른 분야끼리만) */
  threads: { title: string; text: string; categories: string[] }[];
  /** 분야별 소식 (같은 사건은 한 번만, 다른 분야에도 실렸으면 alsoIn) */
  sections: {
    category: string;
    newsletterId: number;
    title: string;
    stories: { heading: string; alsoIn: string[] }[];
  }[];
  /** 관전 포인트 */
  watch: string[];
}

export interface MailsPage {
  items: Mail[];
  total: number;
  /** 달 이동용: 거르기 · 정렬을 적용한 순서로 달마다 통수와 그 달 첫 메일의 순번 */
  months?: MonthIndex[];
  /** 거르기와 상관없는 개수: 전체 · 중요 · 폴더 없음 */
  counts: { all: number; starred: number; unfiled: number };
}
