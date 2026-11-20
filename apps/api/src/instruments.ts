import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as dotenv from 'dotenv';
import { env } from 'src/config/env';

// Sentry는 다른 모듈보다 먼저 초기화되어야 하므로 .env를 직접 읽습니다.
dotenv.config({ path: '.env' });

const dsn = env.sentryDsn;

// DSN이 없으면 Sentry 없이 실행합니다 (로컬 개발, 비용 절감 배포).
if (dsn) {
	Sentry.init({
		dsn,
		integrations: [nodeProfilingIntegration()],
		tracesSampleRate: 0.1,
		// Sentry 10부터 프로파일링은 '세션' 단위 (profilesSampleRate가 없어짐). 서버 하나라 세션 비율은 1로 두고,
		// 표본으로 고른 요청(tracesSampleRate 10%)이 도는 동안만 프로파일한다 (trace)
		profileSessionSampleRate: 1,
		profileLifecycle: 'trace',
		environment: env.nodeEnv,
	});
} else {
	// Sentry는 다른 모듈보다 먼저 초기화해야 해서, 여기서 @nestjs/common(Logger)을 먼저 불러오지 않는다
	// eslint-disable-next-line no-console
	console.warn('SENTRY_DSN이 없어 Sentry 없이 실행합니다.');
}
