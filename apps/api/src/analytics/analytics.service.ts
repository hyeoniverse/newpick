import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { CollectDto } from './dto/collect.dto';
import {
  RETENTION_DAYS,
  channelOf,
  cleanAttention,
  cleanClicks,
  cleanSections,
  deviceOf,
  isBot,
  isIgnoredPath,
  routeOf,
} from './analytics';

const json = (value: unknown) =>
  value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);

/**
 * 방문 통계 (#131): 브라우저 수집기가 보낸 페이지 한 번 보기를 저장한다.
 * 같은 보기를 여러 번(15초마다 · 탭을 숨길 때 · 페이지를 옮길 때) 보내므로 덮어쓰고,
 * 시간 · 스크롤은 줄어들지 않게 큰 값으로 둔다
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 저장했으면 true, 거른 기록(봇 · 관리자 화면)이면 false */
  async collect(dto: CollectDto, userAgent?: string) {
    if (isBot(userAgent) || isIgnoredPath(dto.path)) return false;

    const referrerHost = dto.referrerHost?.toLowerCase() || null;
    const values = {
      durationMs: dto.durationMs,
      scrollDepth: dto.scrollDepth,
      sections: json(cleanSections(dto.sections)),
      attention: json(cleanAttention(dto.attention)),
      clicks: json(cleanClicks(dto.clicks)),
    };
    const existing = await this.prisma.pageView.findUnique({
      where: { id: dto.id },
      select: { sessionId: true, durationMs: true, scrollDepth: true },
    });
    if (existing) {
      // 다른 탭이 같은 번호를 쓰면 무시 (번호는 무작위 32자라 겹치지 않는다)
      if (existing.sessionId !== dto.sessionId) return false;
      await this.prisma.pageView.update({
        where: { id: dto.id },
        data: {
          ...values,
          durationMs: Math.max(existing.durationMs, dto.durationMs),
          scrollDepth: Math.max(existing.scrollDepth, dto.scrollDepth),
        },
      });
      return true;
    }
    await this.prisma.pageView.create({
      data: {
        id: dto.id,
        sessionId: dto.sessionId,
        path: dto.path.split('#')[0].slice(0, 255),
        route: routeOf(dto.path),
        entry: dto.entry,
        channel: channelOf({ ...dto, referrerHost }),
        referrerHost: dto.entry ? referrerHost : null,
        utmSource: dto.utmSource || null,
        utmMedium: dto.utmMedium || null,
        utmCampaign: dto.utmCampaign || null,
        device: deviceOf(dto.viewportW),
        viewportW: dto.viewportW,
        startedAt: new Date(),
        ...values,
      },
    });
    return true;
  }

  /** 180일 지난 기록은 매일 새벽에 지운다 (처리방침 보관 기간) */
  @Cron('0 30 4 * * *', { timeZone: 'Asia/Seoul' })
  async purge() {
    const before = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.pageView.deleteMany({
      where: { startedAt: { lt: before } },
    });
    if (count)
      this.logger.log(`방문 기록 ${count}건 삭제 (${RETENTION_DAYS}일 지남)`);
    return count;
  }
}
