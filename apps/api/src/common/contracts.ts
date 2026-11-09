import type { Newsletter as NewsletterRow } from '@prisma/client';
import type { Newsletter } from '@newpick/shared';

/**
 * api 응답과 공유 타입(@newpick/shared)이 어긋나지 않는지 타입 검사로 지킨다.
 * 칸을 더하거나 빼면 여기서 타입 오류가 나니, 공유 타입도 함께 고친다
 */
type SameKeys<A, B> = [keyof A] extends [keyof B]
  ? [keyof B] extends [keyof A]
    ? true
    : false
  : false;

/** 뉴스레터: DB(Prisma) 칸과 웹이 받는 칸이 같다 */
export const NEWSLETTER_FIELDS_MATCH: SameKeys<NewsletterRow, Newsletter> =
  true;
