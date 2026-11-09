/**
 * API 오류 code 이름. api는 이 이름마다 상태 코드 · 메시지를 정하고(common/errors/error-codes.ts, 빠지거나 남으면 타입 오류),
 * 웹은 응답의 code를 이 타입으로 받아 분기한다. 이름은 바꾸지 않는다 (메시지는 바뀌어도 됨)
 */
export const ERROR_CODE_NAMES = [
  'BAD_REQUEST',
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'ADMIN_ONLY',
  'NOT_FOUND',
  'ROUTE_NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNPROCESSABLE',
  'TOO_MANY_REQUESTS',
  'INTERNAL_ERROR',
  'BAD_GATEWAY',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'GOOGLE_LOGIN_UNAVAILABLE',
  'SITE_CACHE_UNAVAILABLE',
  'SITE_CACHE_FAILED',
  'NEWSLETTER_NOT_FOUND',
  'CATEGORY_NOT_FOUND',
  'CATEGORY_ALREADY_EXISTS',
  'EDITION_NOT_FOUND',
  'NEWS_NOT_FOUND',
  'USER_NOT_FOUND',
  'BOOKMARK_NOT_FOUND',
  'TAG_FOLLOW_LIMIT',
  'HIGHLIGHT_NOT_FOUND',
  'BOOKMARK_ALREADY_EXISTS',
  'SUBSCRIPTION_NOT_FOUND',
  'UNSUBSCRIBE_LINK_INVALID',
  'ALREADY_SUBSCRIBED',
  'INVALID_INTERESTS',
  'EMAIL_UNCHANGED',
  'EMAIL_TAKEN',
  'EMAIL_CODE_TOO_SOON',
  'EMAIL_CODE_INVALID',
  'EMAIL_CODE_EXPIRED',
] as const;

export type ErrorCode = (typeof ERROR_CODE_NAMES)[number];

export const isErrorCode = (value: unknown): value is ErrorCode =>
  typeof value === 'string' && (ERROR_CODE_NAMES as readonly string[]).includes(value);
