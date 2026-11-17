import { Logger } from '@nestjs/common';

/** 없으면 서버가 시작하지 않는 변수 (기본값으로 조용히 동작하지 않게) */
const REQUIRED = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'MONGO_URL',
] as const;

/** 기능마다 함께 있어야 하는 변수: 하나만 있으면 그 기능이 반쯤 켜진 채 조용히 안 되므로 알린다 */
const GROUPS: { feature: string; keys: string[] }[] = [
  {
    feature: 'Google 로그인',
    keys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
  },
  {
    feature: '오픈 모델(Cloudflare Workers AI)',
    keys: ['CF_ACCOUNT_ID', 'CF_AI_TOKEN'],
  },
  { feature: '메일 보내기', keys: ['MAIL_USER', 'MAIL_PASSWORD'] },
];

const isUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

/** 값이 있을 때만 보는 형식 검사: 틀리면 시작하지 않는다 */
const FORMATS: {
  key: string;
  ok: (value: string) => boolean;
  expected: string;
}[] = [
  { key: 'FRONTEND_URL', ok: isUrl, expected: 'http(s) 주소' },
  { key: 'GOOGLE_REDIRECT_URI', ok: isUrl, expected: 'http(s) 주소' },
  {
    key: 'PORT',
    ok: (v) => /^\d+$/.test(v) && Number(v) > 0 && Number(v) < 65536,
    expected: '1~65535 숫자',
  },
  {
    key: 'AI_FALLBACK_DAILY_USD',
    ok: (v) => Number.isFinite(Number(v)) && Number(v) >= 0,
    expected: '0 이상 숫자',
  },
  {
    key: 'COOKIE_SAMESITE',
    ok: (v) => ['lax', 'strict', 'none'].includes(v),
    expected: 'lax · strict · none',
  },
  {
    key: 'SCHEDULER_ENABLED',
    ok: (v) => ['true', 'false'].includes(v),
    expected: 'true · false',
  },
];

const has = (config: Record<string, unknown>, key: string) =>
  config[key] !== undefined && config[key] !== '';

/** 시작할 때 볼 문제: errors는 시작을 막고, warnings는 알리기만 한다 */
export function envProblems(config: Record<string, unknown>) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const missing = REQUIRED.filter((key) => !has(config, key));
  if (missing.length)
    errors.push(`필수 환경 변수가 없습니다: ${missing.join(', ')}`);
  if (
    has(config, 'JWT_SECRET') &&
    config.JWT_SECRET === config.JWT_REFRESH_SECRET
  ) {
    errors.push('JWT_SECRET과 JWT_REFRESH_SECRET은 서로 달라야 합니다.');
  }
  for (const { key, ok, expected } of FORMATS) {
    if (has(config, key) && !ok(String(config[key]))) {
      errors.push(
        `${key} 형식이 맞지 않습니다 (${expected}): ${String(config[key])}`,
      );
    }
  }
  for (const { feature, keys } of GROUPS) {
    const set = keys.filter((key) => has(config, key));
    if (set.length && set.length < keys.length) {
      const absent = keys.filter((key) => !set.includes(key));
      warnings.push(
        `${feature}에 필요한 값이 빠졌습니다: ${absent.join(', ')} (이 기능은 동작하지 않습니다)`,
      );
    }
  }
  return { errors, warnings };
}

/** 서버 시작 시 환경 변수를 확인합니다 (ConfigModule의 validate). 없으면 기본값으로 조용히 동작하지 않고 바로 실패합니다. */
export function validateEnv(config: Record<string, unknown>) {
  const { errors, warnings } = envProblems(config);
  if (errors.length) throw new Error(errors.join('\n'));
  const logger = new Logger('Env');
  for (const warning of warnings) logger.warn(warning);
  return config;
}
