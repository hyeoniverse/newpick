import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as dotenv from 'dotenv';

// Sentry는 다른 모듈보다 먼저 초기화되어야 하므로 .env를 직접 읽습니다.
dotenv.config({ path: '.env' });

const dsn = process.env.SENTRY_DSN;

// DSN이 없으면 Sentry 없이 실행합니다 (로컬 개발, 비용 절감 배포).
if (dsn) {
  Sentry.init({
    dsn,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
    environment: process.env.NODE_ENV || 'development',
  });
} else {
  console.warn('SENTRY_DSN이 없어 Sentry 없이 실행합니다.');
}
