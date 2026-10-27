import { Injectable, Logger } from '@nestjs/common';

/** 웹이 캐시를 비울 때 받는 비밀 값 헤더 (웹 app/api/revalidate/route.ts와 같은 이름) */
export const REVALIDATE_HEADER = 'x-revalidate-secret';
const TIMEOUT_MS = 10_000;

export type SiteCacheResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'failed'; detail?: string };

/**
 * 웹(Next) 사이트 캐시 비우기 (#73). 뉴스레터를 만들거나 지운 뒤 불러,
 * 첫 화면·목록이 예전 글을 10분 동안 보여 주지 않게 한다.
 * FRONTEND_URL의 /api/revalidate를 REVALIDATE_SECRET과 함께 부른다.
 * 실패해도 던지지 않는다 (뉴스레터 생성·삭제는 이미 끝났고, 캐시는 늦어도 10분 뒤 저절로 바뀐다)
 */
@Injectable()
export class SiteCacheService {
  private readonly logger = new Logger('SiteCache');

  async refresh(reason: string): Promise<SiteCacheResult> {
    const base = process.env.FRONTEND_URL;
    const secret = process.env.REVALIDATE_SECRET;
    if (!base || !secret) {
      this.logger.warn(
        `사이트 캐시를 비우지 않음 (${reason}): REVALIDATE_SECRET이 없다`,
      );
      return { ok: false, reason: 'not-configured' };
    }

    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/api/revalidate`, {
        method: 'POST',
        headers: { [REVALIDATE_HEADER]: secret },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        const detail = `웹 응답 ${res.status}`;
        this.logger.error(`사이트 캐시 비우기 실패 (${reason}): ${detail}`);
        return { ok: false, reason: 'failed', detail };
      }
      this.logger.log(`사이트 캐시를 비움 (${reason})`);
      return { ok: true };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`사이트 캐시 비우기 실패 (${reason}): ${detail}`);
      return { ok: false, reason: 'failed', detail };
    }
  }
}
