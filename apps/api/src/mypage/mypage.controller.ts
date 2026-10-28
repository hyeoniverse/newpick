import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  SESSION_HINT_COOKIE,
  authCookieOptions,
  sessionHintCookieOptions,
} from 'src/auth/cookie-options';
import { MyPageService } from './mypage.service';
import { InterestsDto } from 'src/common/dto/interests.dto';
import { AppException } from '../common/errors/app.exception';
import { MyMailQueryDto, MyMailsQueryDto } from './dto/my-mails-query.dto';
import { HighlightsService } from './highlights.service';
import { TasteService } from '../taste/taste.service';
import {
  CreateHighlightDto,
  HighlightsQueryDto,
  UpdateHighlightDto,
} from './dto/highlight.dto';

/** 로그인 필요 (전역 JwtAuthGuard). 구독 상태·기록은 /subscribers에서 조회합니다. */
@Controller('mypage')
export class MyPageController {
  constructor(
    private readonly myPageService: MyPageService,
    private readonly highlightsService: HighlightsService,
    private readonly tasteService: TasteService,
  ) {}

  /** 내 취향 점수 (#123 2단계): 북마크 · 스크랩 · 메모로 모은 태그 · 관심사 */
  @Get('taste')
  async getTaste(@Req() req) {
    return this.tasteService.forUser(this.userIdOf(req));
  }

  /** 내 스크랩 · 메모 (#123). newsletterId를 주면 그 뉴스레터 것만 */
  @Get('highlights')
  async getHighlights(@Req() req, @Query() q: HighlightsQueryDto) {
    return this.highlightsService.list(this.userIdOf(req), q.newsletterId);
  }

  /** 문장 스크랩 (메모는 선택). 같은 문장이면 새로 만들지 않는다 */
  @Post('highlights')
  async createHighlight(@Req() req, @Body() body: CreateHighlightDto) {
    return this.highlightsService.create(this.userIdOf(req), body);
  }

  /** 메모 고치기 (빈 글이면 메모 지우기) */
  @Patch('highlights/:id')
  async updateHighlight(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHighlightDto,
  ) {
    return this.highlightsService.updateNote(this.userIdOf(req), id, body.note);
  }

  @Delete('highlights/:id')
  async deleteHighlight(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.highlightsService.remove(this.userIdOf(req), id);
  }

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
   * 내가 받은 메일 (보낸 시각별로 한 통씩, 쪽 단위)
   */
  @Get('mails')
  async getMails(@Req() req, @Query() q: MyMailsQueryDto) {
    return this.myPageService.getMails(this.userIdOf(req), q.offset, q.limit);
  }

  /**
   * 받은 메일 한 통을 받은 그대로 (HTML)
   */
  @Get('mails/view')
  async getMail(@Req() req, @Query() q: MyMailQueryDto) {
    return this.myPageService.getMail(this.userIdOf(req), new Date(q.sentAt));
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
