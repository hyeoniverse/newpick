import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FollowStoryDto } from './follows.dto';
import { FollowsService } from './follows.service';

const userIdOf = (req: Request) => (req.user as { id: number }).id;

/** 후속 지켜보기 (로그인 필요, 전역 JwtAuthGuard) */
@Controller('mypage/follows')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  /** 지켜보는 소식마다 이어진 소식 */
  @Get()
  list(@Req() req: Request) {
    return this.follows.list(userIdOf(req));
  }

  /** 아직 안 본 후속 소식 수 (머리글 표시) */
  @Get('unseen')
  async unseen(@Req() req: Request) {
    return { count: await this.follows.unseenCount(userIdOf(req)) };
  }

  /** 마이페이지에서 봤으면 모두 본 것으로 */
  @Post('seen')
  seen(@Req() req: Request) {
    return this.follows.markSeen(userIdOf(req));
  }

  /** 뉴스레터 상세: 이 뉴스레터에서 지켜보는 소식들 */
  @Get('newsletter/:id')
  forNewsletter(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.follows.forNewsletter(userIdOf(req), id);
  }

  @Post()
  follow(@Req() req: Request, @Body() body: FollowStoryDto) {
    return this.follows.follow(
      userIdOf(req),
      body.newsletterId,
      body.storyIndex,
    );
  }

  @Delete(':id')
  unfollow(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.follows.unfollow(userIdOf(req), id);
  }
}
