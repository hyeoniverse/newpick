/** 요청 횟수 제한 (IP당, @nestjs/throttler). 한곳에서 보고 고친다 */
const MINUTE = 60_000;

export const THROTTLE = {
  /** 모든 요청 기본: 1분에 120회 */
  default: { ttl: MINUTE, limit: 120 },
  /** 이메일 바꾸기 인증 코드 보내기: 1분에 5회 (메일이 나가므로) */
  emailCode: { ttl: MINUTE, limit: 5 },
  /** 인증 코드 확인: 1분에 10회 (코드 자체도 5번 틀리면 다시 받아야 함) */
  emailVerify: { ttl: MINUTE, limit: 10 },
} as const;
