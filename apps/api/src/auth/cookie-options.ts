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

/**
 * 로그인 여부만 알려 주는 표시 쿠키. 토큰이 아니며 스크립트에서 읽을 수 있습니다.
 * 프론트가 정적 페이지에서 첫 화면을 그리기 전에 로그인 상태를 알 수 있도록 씁니다.
 * refresh token과 함께 발급되고 함께 만료됩니다 (갱신할 때 함께 연장).
 */
export const SESSION_HINT_COOKIE = 'logged_in';

export function sessionHintCookieOptions(maxAge?: number): CookieOptions {
  return { ...authCookieOptions(maxAge), httpOnly: false };
}

/** 짧게: 다른 기기를 로그아웃시키면 그 기기는 늦어도 이만큼 뒤에 풀린다 (갱신은 쓰는 동안 조용히) */
export const ACCESS_TOKEN_MAX_AGE = 30 * 60 * 1000;
/** 로그인 유지: 갱신할 때마다 다시 30일. 30일 동안 한 번도 안 들어오면 다시 로그인 */
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
