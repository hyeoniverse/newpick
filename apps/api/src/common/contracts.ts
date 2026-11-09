import type { Newsletter as NewsletterRow } from '@prisma/client';
import type { Newsletter, TagFollow } from '@newpick/shared';
import type { TagFollowsService } from 'src/mypage/tag-follows.service';

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

/** JSON으로 나갈 때의 모양: Date는 ISO 문자열이 된다 */
type Wire<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Wire<U>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;

/** A(응답)를 B(공유 타입)로 받을 수 있는가 */
type Fits<A, B> = [A] extends [B] ? true : false;

/** 팔로우한 태그: 서비스가 돌려주는 것(JSON으로)이 웹이 받는 TagFollow[]에 맞다 */
export const TAG_FOLLOWS_FIT: Fits<
  Wire<Awaited<ReturnType<TagFollowsService['listWithNews']>>>,
  TagFollow[]
> = true;
