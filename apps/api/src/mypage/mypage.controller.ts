import { Body, Controller, Delete, Get, Put, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  SESSION_HINT_COOKIE,
  authCookieOptions,
  sessionHintCookieOptions,
} from 'src/auth/cookie-options';
import { MyPageService } from './mypage.service';
import { InterestsDto } from 'src/common/dto/interests.dto';
import { AppException } from '../common/errors/app.exception';

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

  /**
   * 회원 탈퇴 (#65). 지운 뒤 로그인 쿠키도 지운다 (로그아웃과 같게)
   */
  @Delete('account')
  async deleteAccount(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.myPageService.deleteAccount(this.userIdOf(req));
    res.clearCookie('access_token', authCookieOptions());
    res.clearCookie('refresh_token', authCookieOptions());
    res.clearCookie(SESSION_HINT_COOKIE, sessionHintCookieOptions());
    return { message: '탈퇴했습니다.' };
  }

  private userIdOf(req): number {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppException('UNAUTHORIZED');
    }
    return userId;
  }
}
