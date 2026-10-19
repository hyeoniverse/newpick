import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { MyPageService } from './mypage.service';
import { InterestsDto } from 'src/common/dto/interests.dto';

/** 로그인 필요 (전역 JwtAuthGuard). 구독 상태·기록은 /subscribers에서 조회합니다. */
@Controller('mypage')
export class MyPageController {
  constructor(private readonly myPageService: MyPageService) {}

  /**
   * 사용자 프로필 조회
   */
  @Get('profile')
  async getProfile(@Req() req) {
    return this.myPageService.getProfile(this.userIdOf(req));
  }

  /**
   * 북마크 조회
   */
  @Get('bookmarks')
  async getBookmarks(@Req() req) {
    return this.myPageService.getBookmarks(this.userIdOf(req));
  }

  /**
   * 관심사 조회
   */
  @Get('interests')
  async getInterests(@Req() req) {
    return this.myPageService.getInterests(this.userIdOf(req));
  }

  /**
   * 관심사 수정 (덮어쓰기)
   */
  @Put('interests')
  async updateInterests(@Req() req, @Body() data: InterestsDto) {
    return this.myPageService.updateInterests(
      this.userIdOf(req),
      data.interests,
    );
  }

  private userIdOf(req): number {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('User not authenticated');
    }
    return userId;
  }
}
