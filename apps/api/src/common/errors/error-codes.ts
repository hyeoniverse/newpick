import { HttpStatus } from '@nestjs/common';

/**
 * API 오류 목록. 모든 오류 응답은 이 표의 code · 상태 코드 · 메시지로 나간다.
 * - code: 프론트가 분기할 때 쓰는 고정 이름 (메시지는 바뀌어도 code는 바꾸지 않는다)
 * - message: 사용자에게 그대로 보여 줘도 되는 한국어 문장
 * 새 오류가 필요하면 여기에 먼저 더하고 `new AppException('CODE')`로 던진다
 */
export const ERROR_CODES = {
  // 공통
  BAD_REQUEST: {
    status: HttpStatus.BAD_REQUEST,
    message: '요청이 올바르지 않습니다.',
  },
  VALIDATION_FAILED: {
    status: HttpStatus.BAD_REQUEST,
    message: '입력값을 확인해 주세요.',
  },
  UNAUTHORIZED: {
    status: HttpStatus.UNAUTHORIZED,
    message: '로그인이 필요합니다.',
  },
  SESSION_EXPIRED: {
    status: HttpStatus.UNAUTHORIZED,
    message: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  },
  FORBIDDEN: { status: HttpStatus.FORBIDDEN, message: '권한이 없습니다.' },
  ADMIN_ONLY: {
    status: HttpStatus.FORBIDDEN,
    message: '관리자만 할 수 있습니다.',
  },
  NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '요청한 정보를 찾을 수 없습니다.',
  },
  ROUTE_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '없는 API 주소입니다.',
  },
  METHOD_NOT_ALLOWED: {
    status: HttpStatus.METHOD_NOT_ALLOWED,
    message: '지원하지 않는 요청 방식입니다.',
  },
  CONFLICT: { status: HttpStatus.CONFLICT, message: '이미 처리된 요청입니다.' },
  PAYLOAD_TOO_LARGE: {
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    message: '보낸 내용이 너무 큽니다.',
  },
  UNPROCESSABLE: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: '처리할 수 없는 값이 있습니다.',
  },
  TOO_MANY_REQUESTS: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: '요청이 너무 많습니다. 잠시 뒤 다시 시도해 주세요.',
  },
  INTERNAL_ERROR: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: '서버에 일시적인 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.',
  },
  BAD_GATEWAY: {
    status: HttpStatus.BAD_GATEWAY,
    message: '외부 서비스와 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
  },
  SERVICE_UNAVAILABLE: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: '지금은 이용할 수 없습니다. 잠시 뒤 다시 시도해 주세요.',
  },
  GATEWAY_TIMEOUT: {
    status: HttpStatus.GATEWAY_TIMEOUT,
    message: '외부 서비스 응답이 늦습니다. 잠시 뒤 다시 시도해 주세요.',
  },

  // 로그인
  GOOGLE_LOGIN_UNAVAILABLE: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: '지금은 구글 로그인을 쓸 수 없습니다.',
  },

  // 사이트 캐시 (#73)
  SITE_CACHE_UNAVAILABLE: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: '사이트 캐시 비우기가 설정되지 않았습니다.',
  },
  SITE_CACHE_FAILED: {
    status: HttpStatus.BAD_GATEWAY,
    message: '사이트 캐시를 비우지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
  },

  // 뉴스레터·분야·발행본
  NEWSLETTER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '뉴스레터를 찾을 수 없습니다.',
  },
  CATEGORY_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '분야를 찾을 수 없습니다.',
  },
  CATEGORY_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: '이미 있는 분야입니다.',
  },
  EDITION_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '고른 분야의 발행본이 없습니다.',
  },
  NEWS_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '요약할 뉴스를 찾지 못했습니다.',
  },

  // 회원·북마크·구독
  USER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '회원 정보를 찾을 수 없습니다.',
  },
  BOOKMARK_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '북마크를 찾을 수 없습니다.',
  },
  BOOKMARK_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: '이미 북마크한 뉴스레터입니다.',
  },
  SUBSCRIPTION_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: '구독 정보가 없습니다.',
  },
  ALREADY_SUBSCRIBED: {
    status: HttpStatus.CONFLICT,
    message: '이미 구독 중입니다.',
  },
  INVALID_INTERESTS: {
    status: HttpStatus.BAD_REQUEST,
    message: '관심 분야를 다시 골라 주세요.',
  },
} as const satisfies Record<string, { status: HttpStatus; message: string }>;

export type ErrorCode = keyof typeof ERROR_CODES;

/** code가 없는 오류(Nest 기본 예외 등)는 상태 코드로 대표 code를 정한다 */
export const DEFAULT_CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'UNPROCESSABLE',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

export const codeForStatus = (status: number): ErrorCode =>
  DEFAULT_CODE_BY_STATUS[status] ??
  (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
