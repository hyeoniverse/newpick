import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * 요청 횟수 제한을 '누가' 보냈는지로 센다 (기본 ThrottlerGuard는 req.ip).
 * api는 Cloudflare Tunnel 뒤에 있어 req.ip가 늘 터널(cloudflared) 컨테이너 하나라, 기본값이면 'IP당' 제한이
 * 사실상 '모든 사용자 합쳐서'였다: 한 사람이 많이 보내면 모두가 막히고, 인증 코드 '1분 5회'도 전체가 나눠 썼다.
 * - 로그인한 요청: 사용자 id (JwtAuthGuard가 먼저 돌아 req.user를 채운다. app.module의 가드 순서)
 * - 그 밖: Cloudflare가 넣는 CF-Connecting-IP. 운영 서버는 인바운드 포트가 없어 모든 요청이 Cloudflare를 거치고,
 *   Cloudflare는 이 머리글을 덮어써 접속자가 꾸밀 수 없다. 없으면(로컬) req.ip
 */
@Injectable()
export class ClientThrottlerGuard extends ThrottlerGuard {
	protected getTracker(req: Record<string, unknown>): Promise<string> {
		return Promise.resolve(clientKey(req as unknown as Request));
	}
}

/** 요청을 보낸 쪽을 가르는 열쇠: 'user:12' 또는 'ip:1.2.3.4' */
export function clientKey(req: Pick<Request, 'headers' | 'ip'> & { user?: unknown }): string {
	const userId = (req.user as { id?: unknown } | undefined)?.id;
	if (typeof userId === 'number') return `user:${userId}`;
	const forwarded = req.headers['cf-connecting-ip'];
	const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.trim() || req.ip || 'unknown';
	return `ip:${ip}`;
}
