/**
 * 뉴스레터 한 편: api 응답 JSON 그대로 (DB newsletters 한 줄, 날짜는 ISO 문자열).
 * api 쪽 Prisma 모델과 칸 이름이 하나라도 다르면 api의 타입 검사가 실패한다 (common/contracts.ts)
 */
export interface Newsletter {
  id: number;
  title: string;
  /** 제목에 담지 않은 나머지 소식 한 줄. 예전 뉴스레터는 null */
  subtitle: string | null;
  /** 키워드 3~6개. 예전 뉴스레터는 null */
  keywords: string[] | null;
  /** AI 요약 (목록 · 카드 설명) */
  content: string;
  /** 본문 HTML (api newsletter-html.ts 구조). 아주 예전 뉴스레터는 null */
  contentAsHTML: string | null;
  imageUrl: string | null;
  categoryId: number;
  viewcount: number;
  /** 쓴 기사 링크, 쉼표로 이음 */
  usedNews: string;
  createdAt: string;
}

/** GET /newsletters/:id */
export interface NewsletterDetail {
  newsletter: Newsletter;
  previousNewsletter: Newsletter | null;
  nextNewsletter: Newsletter | null;
}

/** 관리자 발행 목록 한 줄 (GET /scheduler/dashboard/newsletters) */
export type NewsletterListItem = Pick<
  Newsletter,
  'id' | 'title' | 'categoryId' | 'viewcount' | 'createdAt'
>;
