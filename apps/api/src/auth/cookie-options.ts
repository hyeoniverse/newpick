import { CookieOptions } from 'express';

/**
 * 인증 쿠키 공통 옵션.
 * - COOKIE_DOMAIN: 프론트와 api가 서브도메인으로 나뉠 때만 지정 (예: .example.com). 없으면 요청한 호스트에만 저장
 * - COOKIE_SAMESITE: 기본 none (프론트와 api 도메인이 다를 때 필요). 같은 사이트에서 프록시로 붙이면 lax 권장
 */
export function authCookieOptions(maxAge?: number): CookieOptions {
  const sameSite = (process.env.COOKIE_SAMESITE ??
    'none') as CookieOptions['sameSite'];
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
