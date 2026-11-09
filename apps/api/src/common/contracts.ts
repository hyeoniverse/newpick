import type { Newsletter as NewsletterRow } from '@prisma/client';
import type {
  AdminArticlePage,
  AdminMailRow,
  AdminSubscriberPage,
  AdminUserRow,
  AiLogPage,
  Paged,
  BookmarkItem,
  BookmarkPage,
  HighlightPage,
  Highlight,
  MyTaste,
  Newsletter,
  TagFollow,
} from '@newpick/shared';
import type { AdminService } from 'src/admin/admin.service';
import type { DashboardService } from 'src/scheduler/dashboard.service';
import type { HighlightsService } from 'src/mypage/highlights.service';
import type { MyPageService } from 'src/mypage/mypage.service';
import type { TasteService } from 'src/taste/taste.service';
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

/** 서비스 메서드가 돌려주는 것을 JSON으로 바꾼 모양 */
type Response<S, K extends keyof S> = S[K] extends (
  ...args: never[]
) => Promise<infer R>
  ? Wire<R>
  : never;

/** 스크랩: 상세 화면 형광펜 · 마이페이지 목록 · 한 쪽 */
export const HIGHLIGHTS_FIT: Fits<
  Response<HighlightsService, 'list'>,
  Highlight[]
> = true;
export const HIGHLIGHT_PAGE_FIT: Fits<
  Response<HighlightsService, 'page'>,
  HighlightPage
> = true;
/** 북마크: 전체 목록 · 한 쪽 */
export const BOOKMARKS_FIT: Fits<
  Response<MyPageService, 'getBookmarks'>,
  BookmarkItem[]
> = true;
export const BOOKMARK_PAGE_FIT: Fits<
  Response<MyPageService, 'getBookmarkPage'>,
  BookmarkPage
> = true;
/** 내 취향 */
export const MY_TASTE_FIT: Fits<
  Response<TasteService, 'forUser'>,
  MyTaste
> = true;

/** 관리자 목록 */
export const ADMIN_USERS_FIT: Fits<
  Response<AdminService, 'getUsers'>,
  Paged<AdminUserRow>
> = true;
export const ADMIN_SUBSCRIBERS_FIT: Fits<
  Response<AdminService, 'getSubscribers'>,
  AdminSubscriberPage
> = true;
export const ADMIN_ARTICLES_FIT: Fits<
  Response<DashboardService, 'listArticles'>,
  AdminArticlePage
> = true;
export const ADMIN_MAILS_FIT: Fits<
  Response<DashboardService, 'listMails'>,
  Paged<AdminMailRow>
> = true;
export const AI_LOGS_FIT: Fits<
  Response<DashboardService, 'listAiLogs'>,
  AiLogPage
> = true;
