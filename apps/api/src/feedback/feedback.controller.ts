import { Body, Controller, Delete, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { FeedbackService } from './feedback.service';
import { BookmarkDto } from './dto/bookmark.dto';
import { AppException } from '../common/errors/app.exception';

/** 로그인 필요 (전역 JwtAuthGuard) */
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('bookmark')
  async addBookmark(@Req() req: Request, @Body() body: BookmarkDto) {
    return this.feedbackService.addBookmark(this.userIdOf(req), body.targetId);
  }

  @Delete('bookmark')
  async removeBookmark(@Req() req: Request, @Body() body: BookmarkDto) {
    return this.feedbackService.removeBookmark(
      this.userIdOf(req),
      body.targetId,
    );
  }

  private userIdOf(req: Request): number {
    const userId = Number((req.user as { id?: number })?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppException('UNAUTHORIZED');
    }
    return userId;
  }
}
