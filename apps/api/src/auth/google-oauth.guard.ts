import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const GOOGLE_ENV = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
] as const;

/** Google 로그인에 필요한 환경 변수 중 빠진 것 */
export const missingGoogleEnv = (env: NodeJS.ProcessEnv = process.env) =>
  GOOGLE_ENV.filter((key) => !env[key]);

/**
 * Google 로그인 경로의 가드. 키가 없으면 passport까지 가지 않고 503으로 알립니다.
 * (키 없이도 서버의 나머지 기능은 동작해야 하므로, 시작할 때가 아니라 요청할 때 확인합니다)
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const missing = missingGoogleEnv();
    if (missing.length) {
      throw new ServiceUnavailableException(
        `Google 로그인이 설정되지 않았습니다: ${missing.join(', ')}`,
      );
    }
    return super.canActivate(context);
  }
}
