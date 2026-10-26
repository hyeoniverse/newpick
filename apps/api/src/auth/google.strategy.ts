import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { missingGoogleEnv } from './google-oauth.guard';

// 키가 없을 때 passport가 생성자에서 예외를 던지지 않게 넣는 값. 실제 요청은 GoogleOAuthGuard가 503으로 막습니다.
const NOT_CONFIGURED = 'google-oauth-not-configured';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || NOT_CONFIGURED,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || NOT_CONFIGURED,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || NOT_CONFIGURED,
      scope: ['email', 'profile'],
    });
    const missing = missingGoogleEnv();
    if (missing.length) {
      new Logger(GoogleStrategy.name).warn(
        `${missing.join(', ')}이(가) 없어 Google 로그인 없이 실행합니다.`,
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const user = {
      googleSub: id,
      email: emails?.[0]?.value || null,
      username: displayName || null,
      profileImg: photos?.[0]?.value || null,
    };

    return done(null, user);
  }
}
