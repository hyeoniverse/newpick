import { ExecutionContext, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AppException } from '../common/errors/app.exception';

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
      // 어떤 키가 빠졌는지는 서버 로그(시작할 때 경고)에만 남기고 응답에는 싣지 않는다
      throw new AppException('GOOGLE_LOGIN_UNAVAILABLE');
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (!request.path?.endsWith('/callback')) return super.canActivate(context);
    return this.callbackOrRedirect(context);
  }

  /**
   * 구글에서 돌아오는 길(동의 취소·코드 만료 등)에서 실패하면 JSON 대신 사이트로 돌려보낸다.
   * 브라우저가 직접 여는 주소라 오류 JSON을 보여 주면 사용자는 글자만 있는 화면을 본다
   */
  private async callbackOrRedirect(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      return await (super.canActivate(context) as Promise<boolean>);
    } catch {
      context.switchToHttp().getResponse<Response>().redirect(loginFailedUrl());
      return false;
    }
  }
}

/** 로그인 실패를 웹에 알리는 주소. 웹은 ?login=failed를 보고 안내한다 */
export const loginFailedUrl = () =>
  `${process.env.FRONTEND_URL ?? ''}/?login=failed`;
