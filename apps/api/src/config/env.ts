/**
 * 환경 변수 한 곳 (#199). 앱 코드는 process.env 대신 여기의 env를 읽는다 (lint로 막음).
 * - 값은 읽을 때마다 process.env에서 가져온다 (getter): .env를 늦게 읽어도, 테스트가 값을 바꿔도 지금 값이 보인다
 * - 빈 문자열은 없는 것으로 본다 (예전 `X || 기본값`과 같음)
 * - 시작할 때 형식 검사는 env.validation.ts (ConfigModule의 validate)
 */

/** 원래 환경 (검사 · 빠진 키 찾기용). 값을 쓰는 코드는 아래 env를 쓴다 */
export const rawEnv = (): Record<string, string | undefined> => process.env;

const read = (key: string): string | undefined => {
	const value = process.env[key];
	return value === undefined || value === '' ? undefined : value;
};

export type SameSite = 'lax' | 'strict' | 'none';

export const env = {
	/** development · test · production */
	get nodeEnv() {
		return read('NODE_ENV') ?? 'development';
	},
	/** 배포가 넣는 버전 (헬스 체크에 보임) */
	get appVersion() {
		return read('APP_VERSION') ?? 'dev';
	},
	get port() {
		return Number(read('PORT') ?? 3001);
	},
	/** 웹 주소 (CORS · 메일 링크 · 로그인 뒤 돌아갈 곳 · 캐시 비우기). 필수 */
	get frontendUrl() {
		return read('FRONTEND_URL') ?? '';
	},

	/** 인증. 둘 다 필수이고 서로 달라야 한다 */
	get jwtSecret() {
		return read('JWT_SECRET') ?? '';
	},
	get jwtRefreshSecret() {
		return read('JWT_REFRESH_SECRET') ?? '';
	},
	/** 수신 거부 링크 서명. 없으면 JWT_SECRET에서 용도를 붙여 뽑는다 */
	get unsubscribeSecret() {
		return read('UNSUBSCRIBE_SECRET');
	},
	/** 웹의 사이트 캐시 비우기(/api/revalidate) 비밀 값. 없으면 비우지 않는다 */
	get revalidateSecret() {
		return read('REVALIDATE_SECRET');
	},
	/** COOKIE_DOMAIN: 프론트와 api가 서브도메인으로 나뉠 때만 (예: .example.com) */
	get cookieDomain() {
		return read('COOKIE_DOMAIN');
	},
	/** 기본 lax (브라우저는 프론트의 /api 프록시로 요청하므로 같은 사이트 쿠키) */
	get cookieSameSite(): SameSite {
		return (read('COOKIE_SAMESITE') ?? 'lax') as SameSite;
	},

	/** 수집한 기사 저장소 (MongoDB). 필수 */
	get mongoUrl() {
		return read('MONGO_URL') ?? '';
	},

	/** Google 로그인 (셋이 함께 있어야 동작, 없으면 로그인 경로만 503) */
	google: {
		get clientId() {
			return read('GOOGLE_CLIENT_ID');
		},
		get clientSecret() {
			return read('GOOGLE_CLIENT_SECRET');
		},
		get redirectUri() {
			return read('GOOGLE_REDIRECT_URI');
		},
	},

	/** Claude 모델 (#48 · #47). ANTHROPIC_API_KEY는 SDK가 직접 읽는다 */
	get claudeModel() {
		return read('CLAUDE_MODEL') ?? 'claude-sonnet-5-5';
	},
	get claudeFastModel() {
		return read('CLAUDE_FAST_MODEL') ?? 'claude-haiku-5-5';
	},
	/** Cloudflare Workers AI (#119). 둘 다 있어야 오픈 모델을 쓴다 */
	cloudflare: {
		get accountId() {
			return read('CF_ACCOUNT_ID');
		},
		get aiToken() {
			return read('CF_AI_TOKEN');
		},
	},
	get aiOpenModel() {
		return read('AI_OPEN_MODEL') ?? '@cf/google/gemma-4-26b-a4b-it';
	},
	get aiEmbedModel() {
		return read('AI_EMBED_MODEL') ?? '@cf/baai/bge-m3';
	},
	/** 오픈 모델이 안 될 때 Claude로 넘기는 비용의 하루 상한 (USD) */
	get aiFallbackDailyUsd() {
		return Number(read('AI_FALLBACK_DAILY_USD') ?? 0.1);
	},

	/** 소식 사진 (없으면 그 출처는 건너뜀) */
	get pexelsApiKey() {
		return read('PEXELS_API_KEY');
	},
	get unsplashAccessKey() {
		return read('UNSPLASH_ACCESS_KEY');
	},

	/** 메일 보내는 계정 (Gmail SMTP). 보내는 주소 · 문의처로도 쓴다 */
	get mailUser() {
		return read('MAIL_USER');
	},
	get mailPassword() {
		return read('MAIL_PASSWORD');
	},
	/** 예약 작업이 실패하면 알릴 주소 (없으면 알리지 않음) */
	get adminNotifyEmail() {
		return read('ADMIN_NOTIFY_EMAIL');
	},

	/** 예약 작업 자동 실행. 'false'면 끈다 (보통 로컬) */
	get schedulerEnabled() {
		return read('SCHEDULER_ENABLED') !== 'false';
	},
	/** 오류 기록 (Sentry, 운영에서만 켬 #67) */
	get sentryDsn() {
		return read('SENTRY_DSN');
	},
};
