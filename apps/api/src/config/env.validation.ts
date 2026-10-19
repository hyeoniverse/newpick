/** 서버 시작 시 필수 환경 변수를 확인합니다. 없으면 기본값으로 조용히 동작하지 않고 바로 실패합니다. */
const REQUIRED = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`필수 환경 변수가 없습니다: ${missing.join(', ')}`);
  }
  if (config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET과 JWT_REFRESH_SECRET은 서로 달라야 합니다.');
  }
  return config;
}
