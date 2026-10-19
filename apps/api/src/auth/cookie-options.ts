import { CookieOptions } from 'express';

/**
 * 인증 쿠키 공통 옵션.
 * - COOKIE_DOMAIN: 프론트와 api가 서브도메인으로 나뉠 때만 지정 (예: .example.com). 없으면 요청한 호스트에만 저장
 * - COOKIE_SAMESITE: 기본 lax. 브라우저는 프론트의 /api 프록시로 요청하므로 같은 사이트 쿠키입니다.
 *   프론트와 api를 다른 사이트에서 직접 호출하는 구성이면 none
 */
export function authCookieOptions(maxAge?: number): CookieOptions {
  const sameSite = (process.env.COOKIE_SAMESITE ??
    'lax') as CookieOptions['sameSite'];
  return {
    httpOnly: true,
    secure: true,
    sameSite,
    path: '/',
    ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    ...(maxAge !== undefined && { maxAge }),
  };
}

export const ACCESS_TOKEN_MAX_AGE = 3 * 60 * 60 * 1000; // 3시간
export const REFRESH_TOKEN_MAX_AGE = 12 * 60 * 60 * 1000; // 12시간
