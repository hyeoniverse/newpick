import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { missingGoogleEnv } from './google-oauth.guard';
import { env } from 'src/config/env';
import type { StateStore } from 'passport-oauth2';
import { CookieStateStore } from './oauth-state';

/** Google 로그인 콜백에서 req.user에 들어가는 값 */
export type GoogleUser = {
	googleSub: string;
	email: string | null;
	emailVerified: boolean;
	username: string | null;
	profileImg: string | null;
};

// 키가 없을 때 passport가 생성자에서 예외를 던지지 않게 넣는 값. 실제 요청은 GoogleOAuthGuard가 503으로 막습니다.
const NOT_CONFIGURED = 'google-oauth-not-configured';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor() {
		super({
			clientID: env.google.clientId ?? NOT_CONFIGURED,
			clientSecret: env.google.clientSecret ?? NOT_CONFIGURED,
			callbackURL: env.google.redirectUri ?? NOT_CONFIGURED,
			scope: ['email', 'profile'],
			// 로그인 CSRF 막기: 구글로 보낼 때 state를 만들어 httpOnly 쿠키에 두고, 돌아오면 같은지 본다 (oauth-state.ts)
			// (타입의 오버로드는 인자 2 · 3 · 4개 모두를 요구하지만, passport-oauth2는 실제 함수의 인자 개수로 하나를 골라 부른다)
			store: new CookieStateStore() as unknown as StateStore,
		});
		const missing = missingGoogleEnv();
		if (missing.length) {
			new Logger(GoogleStrategy.name).warn(`${missing.join(', ')}이(가) 없어 Google 로그인 없이 실행합니다.`);
		}
	}

	async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<void> {
		const { id, emails, displayName, photos } = profile;

		const user: GoogleUser = {
			googleSub: id,
			email: emails?.[0]?.value || null,
			// Google이 확인한 주소인지 (다른 Google 계정으로 바꿀 때 인증 코드 대신 이것으로)
			emailVerified: emails?.[0]?.verified !== false,
			username: displayName || null,
			profileImg: photos?.[0]?.value || null,
		};

		return done(null, user);
	}
}
