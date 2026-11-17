import type { Request } from 'express';

/** 로그인한 사용자 (JwtStrategy.validate가 req.user에 넣는 값) */
export type AuthUser = {
	id: number;
	email?: string;
	username?: string;
	profileImg?: string;
};

/** 로그인 확인(JwtAuthGuard)을 거친 요청. @Public 경로에서는 user가 없을 수 있다 */
export type AuthedRequest = Request & { user?: AuthUser };
