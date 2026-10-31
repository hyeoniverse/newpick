import { Controller, Get, Logger, Param, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { Public } from 'src/auth/decorators/auth.decorators';
import { verifyMailLinkToken } from './mail-link';

/**
 * 메일 링크 (#123 15): 세고 원래 주소로 보낸다. 로그인 없이 (메일 앱에서 바로 연다).
 * 기록이 실패해도 이동은 막지 않는다. 서명이 틀린 링크는 사이트 첫 화면으로
 */
@Public()
@SkipThrottle()
@Controller('r')
export class MailClickController {
  private readonly logger = new Logger(MailClickController.name);

  constructor(private readonly prisma: MysqlPrismaService) {}

  @Get(':token')
  async go(@Param('token') token: string, @Res() res: Response) {
    const link = verifyMailLinkToken(token);
    if (!link) return res.redirect(302, process.env.FRONTEND_URL || '/');
    await this.prisma.mailClick
      .create({
        data: { day: link.day, personal: link.personal, kind: link.kind },
      })
      .catch((error) =>
        this.logger.warn(`메일 클릭 기록 실패: ${(error as Error).message}`),
      );
    return res.redirect(302, link.url);
  }
}
