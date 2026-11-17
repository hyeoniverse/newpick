import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { env } from 'src/config/env';
import type { AuthUser } from './authed-request';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(req: Request) => {
					let token = null;
					if (req && req.cookies) {
						token = req.cookies['access_token']; // 쿠키에서 `access_token` 가져오기
					}
					return token;
				},
			]),
			ignoreExpiration: false,
			secretOrKey: env.jwtSecret,
		});
	}

	/** 토큰 안의 값 (auth.service가 서명할 때 넣는다) */
	async validate(payload: { sub: number; email?: string; username?: string; profileImg?: string }): Promise<AuthUser> {
		return {
			id: payload.sub, // 수정됨
			email: payload.email,
			username: payload.username,
			profileImg: payload.profileImg,
		};
	}
}
