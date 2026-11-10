/**
 * API 응답 전 · 후 비교 대상 (#229). 같은 요청을 보내 응답을 저장하고 비교한다 (조회만, 쓰기 요청 없음).
 * - auth: 'public' | 'user' | 'admin' (user · admin은 같은 시험 계정, 관리자여야 admin 응답이 나온다)
 * - 기간은 고정한다: '오늘'을 쓰면 날이 바뀔 때 결과가 달라진다
 */
const FROM = '2026-10-12';
const TO = '2026-11-10';
const RANGE = `from=${FROM}&to=${TO}`;
const NEWSLETTER = 72;

export const TARGETS = [
  // 공개
  ['public', '/category'],
  ['public', '/category/1'],
  ['public', '/newsletters?limit=5&offset=0'],
  ['public', '/newsletters/trends'],
  ['public', `/newsletters/${NEWSLETTER}`],
  ['public', '/newsletters/category/3?limit=5&offset=0'],
  [
    'public',
    '/newsletters/search?keyword=%EA%B8%88%EB%A6%AC&limit=10&offset=0',
  ],
  ['public', '/newsletters/keywords'],
  ['public', '/newsletters/keywords/all'],
  ['public', '/edition/preview?categories=1,3'],
  // 로그인한 사람
  ['user', '/mypage/profile'],
  ['user', '/mypage/interests'],
  ['user', '/mypage/personal-mail'],
  ['user', '/mypage/bookmarks'],
  ['user', '/mypage/bookmarks/page?offset=0&limit=24'],
  ['user', '/mypage/highlights'],
  ['user', '/mypage/highlights/page?offset=0&limit=30'],
  ['user', '/mypage/taste'],
  ['user', '/mypage/folders'],
  ['user', '/mypage/tag-follows'],
  ['user', '/mypage/follows'],
  ['user', '/mypage/follows/unseen'],
  ['user', `/mypage/follows/newsletter/${NEWSLETTER}`],
  ['user', `/mypage/follows/newsletter/${NEWSLETTER}/updates`],
  ['user', '/mypage/mails?offset=0&limit=5'],
  ['user', '/subscribers/status'],
  ['user', '/auth/sessions'],
  // 관리자
  ['admin', '/admin/users?limit=20&offset=0'],
  ['admin', '/admin/subscribers?limit=20&offset=0'],
  ['admin', '/admin/categories'],
  ['admin', '/admin/tags/rules'],
  ['admin', `/scheduler/dashboard?${RANGE}`],
  ['admin', `/scheduler/dashboard/newsletters?${RANGE}&limit=20&offset=0`],
  ['admin', `/scheduler/dashboard/mails?${RANGE}&limit=20&offset=0`],
  ['admin', `/scheduler/dashboard/ai-logs?${RANGE}&limit=20&offset=0`],
  ['admin', `/scheduler/dashboard/job-runs?${RANGE}&limit=20&offset=0`],
  ['admin', `/scheduler/dashboard/articles?${RANGE}&limit=20&offset=0`],
  ['admin', `/scheduler/stats/subscribers?${RANGE}`],
  ['admin', `/scheduler/stats/cost?${RANGE}`],
  ['admin', `/scheduler/stats/delivery?${RANGE}`],
  ['admin', `/scheduler/stats/traffic?${RANGE}`],
  ['admin', '/scheduler/stats/taste'],
  ['admin', `/scheduler/stats/page?${RANGE}&route=%2Farticles`],
  ['admin', '/scheduler/schedule'],
];

/**
 * 매번 달라지는 값: 비교에서 뺀다 (키 이름, 어느 깊이든).
 * 새로 찾으면 여기에 더하고 이유를 적는다
 */
export const VOLATILE_KEYS = [
  // 응답을 감싸는 interceptor · 오류 응답의 응답 시각
  'timestamp',
];
