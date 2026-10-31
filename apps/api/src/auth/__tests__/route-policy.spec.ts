import { readRoutePolicies, Policy } from './route-policy';
import { AppController } from 'src/app.controller';
import { AdminController } from 'src/admin/admin.controller';
import { AiSummaryController } from 'src/ai-summary/ai-summary.controller';
import { AuthController } from 'src/auth/auth.controller';
import { CategoryController } from 'src/category/category.controller';
import { CrawlingController } from 'src/crawling/crawling.controller';
import { FeedbackController } from 'src/feedback/feedback.controller';
import { MyPageController } from 'src/mypage/mypage.controller';
import { FollowsController } from 'src/follows/follows.controller';
import { BasicRepositoryController } from 'src/repository/controllers/newsletter.controller';
import { AiProcessingLogController } from 'src/repository/controllers/aiProcessingLog.controller';
import { EmailArchivesController } from 'src/repository/controllers/emailArchieve.controller';
import { SchedulerController } from 'src/scheduler/scheduler.controller';
import { SubscriberController } from 'src/subscriber/subscriber.controller';
import { UnsubscribeController } from 'src/subscriber/unsubscribe.controller';
import { EditionController } from 'src/edition/edition.controller';
import { AnalyticsController } from 'src/analytics/analytics.controller';

/**
 * 모든 라우트의 접근 정책. 라우트를 추가·삭제하거나 정책을 바꾸면 이 표도 함께 바꿔야 테스트가 통과합니다.
 * - public: 로그인 없이 호출 가능 (@Public)
 * - auth: 로그인 필요 (전역 JwtAuthGuard 기본값)
 * - admin: 관리자만 (@AdminOnly)
 */
const EXPECTED: Record<string, Policy> = {
  'GET /': 'public',

  // 방문 기록 받기 (#131): 로그인 없이
  'POST analytics/collect': 'public',

  'GET auth/google': 'public',
  'GET auth/google/callback': 'public',
  'GET auth/refresh': 'public',
  'POST auth/logout': 'auth',
  'GET auth/google/link': 'auth',
  'GET auth/sessions': 'auth',
  'POST auth/sessions/logout-others': 'auth',
  'DELETE auth/sessions/:id': 'auth',

  'GET newsletters': 'public',
  'GET newsletters/trends': 'public',
  'GET newsletters/search': 'public',
  'GET newsletters/keywords': 'public',
  'GET newsletters/keywords/all': 'public',
  'GET admin/tags/rules': 'admin',
  'GET admin/subscribers': 'admin',
  'GET admin/categories': 'admin',
  'PATCH newsletters/:id': 'admin',
  'POST admin/tags/merge': 'admin',
  'POST admin/tags/remove': 'admin',
  'DELETE admin/tags/rules/:id': 'admin',
  'GET newsletters/:id': 'public',
  'GET newsletters/category/:categoryId': 'public',
  'GET newsletters/random/:num/:from': 'public',
  'POST newsletters/viewcount/:id': 'public',
  'DELETE newsletters/:id': 'admin',
  'POST newsletters/reset-viewcount/:id': 'admin',

  'GET category': 'public',
  'GET category/:id': 'public',
  'GET category/name/:name': 'public',
  'POST category': 'admin',
  'PUT category/:id': 'admin',
  'DELETE category/:id': 'admin',

  'GET crawling/link': 'public',
  'GET crawling': 'admin',
  'GET crawling/category/:categoryId': 'admin',

  'POST ai-summary/summarize': 'admin', // 체험은 최신 발행본으로 (#54). 공개 Claude 호출 경로 없음
  'POST ai-summary/get-news': 'admin',

  'POST feedback/bookmark': 'auth',
  'DELETE feedback/bookmark': 'auth',

  'GET mypage/highlights': 'auth',
  'GET mypage/highlights/page': 'auth',
  'GET mypage/bookmarks/page': 'auth',
  'GET mypage/taste': 'auth',
  'POST mypage/highlights': 'auth',
  'POST mypage/highlights/delete': 'auth',
  'POST mypage/highlights/bulk': 'auth',
  'GET mypage/folders': 'auth',
  'PATCH mypage/mails/mark': 'auth',
  'POST mypage/bookmarks/move': 'auth',
  'POST mypage/folders': 'auth',
  'PATCH mypage/folders/:id': 'auth',
  'DELETE mypage/folders/:id': 'auth',
  'PATCH mypage/highlights/:id': 'auth',
  'DELETE mypage/highlights/:id': 'auth',
  'GET mypage/profile': 'auth',
  'GET mypage/follows': 'auth',
  'GET mypage/follows/unseen': 'auth',
  'POST mypage/follows/seen': 'auth',
  'GET mypage/follows/newsletter/:id': 'auth',
  'POST mypage/follows': 'auth',
  'DELETE mypage/follows/:id': 'auth',
  'POST mypage/email/code': 'auth',
  'POST mypage/email/verify': 'auth',
  'GET mypage/bookmarks': 'auth',
  'GET mypage/mails': 'auth',
  'GET mypage/mails/view': 'auth',
  'GET mypage/interests': 'auth',
  'PUT mypage/interests': 'auth',
  'DELETE mypage/account': 'auth',

  'POST subscribers/start': 'auth',
  'POST subscribers/pause': 'auth',
  'DELETE subscribers/cancel': 'auth',
  'GET subscribers/status': 'auth',
  'GET subscribers/history': 'auth',
  'GET subscribers/all': 'admin',
  'GET subscribers/unsubscribe': 'public',
  'POST subscribers/unsubscribe': 'public',

  'GET admin/users': 'admin',
  'DELETE admin/users/:id': 'admin',
  'GET admin/bookmarks': 'admin',
  'PATCH admin/users/:id': 'admin',
  'POST admin/site-cache/refresh': 'admin',

  'GET ai-processing-logs': 'admin',
  'GET ai-processing-logs/:id': 'admin',
  'DELETE ai-processing-logs/:id': 'admin',
  'GET email-archives': 'admin',
  'GET email-archives/:id': 'admin',
  'GET health': 'public',
  'GET contact': 'public',
  'DELETE email-archives/:id': 'admin',

  'POST scheduler/toggle/crawling': 'admin',
  'POST scheduler/toggle/ai-summary': 'admin',
  'POST scheduler/toggle/mail-send': 'admin',
  'GET scheduler/status': 'admin',
  'GET scheduler/dashboard': 'admin',
  'GET scheduler/dashboard/mail': 'admin',
  'GET scheduler/dashboard/newsletters': 'admin',
  'GET scheduler/dashboard/mails': 'admin',
  'GET scheduler/dashboard/ai-logs': 'admin',
  'GET scheduler/dashboard/job-runs': 'admin',
  'GET scheduler/dashboard/articles': 'admin',
  'GET scheduler/stats/subscribers': 'admin',
  'GET scheduler/stats/cost': 'admin',
  'GET scheduler/stats/delivery': 'admin',
  'GET scheduler/stats/traffic': 'admin',
  'GET scheduler/stats/taste': 'admin',
  'GET scheduler/stats/page': 'admin',
  'GET scheduler/schedule': 'admin',
  'PUT scheduler/schedule': 'admin',
  'POST scheduler/change/mail-send-cycle': 'admin',
  'POST scheduler/manual/crawling': 'admin',
  'POST scheduler/manual/ai-summary': 'admin',
  'POST scheduler/manual/mail-send': 'admin',
  'GET scheduler/mail-send-cycle': 'admin',

  'GET edition/preview': 'public',
};

describe('라우트 접근 정책', () => {
  const actual = readRoutePolicies([
    AppController,
    AuthController,
    BasicRepositoryController,
    CategoryController,
    CrawlingController,
    AiSummaryController,
    FeedbackController,
    MyPageController,
    FollowsController,
    SubscriberController,
    UnsubscribeController,
    AdminController,
    AiProcessingLogController,
    EmailArchivesController,
    SchedulerController,
    EditionController,
    AnalyticsController,
  ]);

  it('모든 라우트가 정해진 정책과 일치한다', () => {
    expect(actual).toEqual(EXPECTED);
  });

  it('@Public과 @AdminOnly가 함께 붙은 라우트가 없다 (관리자 확인에 필요한 로그인 정보가 비게 됨)', () => {
    expect(Object.values(actual)).not.toContain('public+admin');
  });
});
