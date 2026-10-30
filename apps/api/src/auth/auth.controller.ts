import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleOAuthGuard, loginFailedUrl } from './google-oauth.guard';
import { AppException } from '../common/errors/app.exception';
import {
  ACCESS_TOKEN_MAX_AGE,
  GOOGLE_LINK_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  SESSION_HINT_COOKIE,
  authCookieOptions,
  sessionHintCookieOptions,
} from './cookie-options';
import { Public } from 'src/auth/decorators/auth.decorators';
import { MailService } from '../mail/mail.service';
import { notifyEmailChanged } from '../mail/account-mail';

/** 다른 Google 계정으로 바꾼 뒤 돌아갈 곳. 웹은 ?google=…를 보고 안내한다 */
const linkResultUrl = (result: string) =>
  `${process.env.FRONTEND_URL ?? ''}/mypage?tab=settings&google=${result}`;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mail: MailService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleLogin() {
    return { message: 'Redirecting to Google OAuth...' };
  }

  /** 다른 Google 계정으로 바꾸기 (로그인 필요): 가드가 표시 쿠키를 남기고 구글 계정 고르기로 보낸다 */
  @Get('google/link')
  @UseGuards(GoogleOAuthGuard)
  async googleLink() {
    return { message: 'Redirecting to Google OAuth...' };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // 브라우저가 직접 여는 주소라, 실패하면 JSON이 아니라 사이트로 돌려보낸다
    if (!req.user) return res.redirect(loginFailedUrl());

    const { googleSub, email, username, profileImg, emailVerified } =
      req.user as any;

    // 다른 Google 계정으로 바꾸는 중이면 새 로그인이 아니라 지금 계정의 연결을 바꾼다
    const linkUserId = this.authService.linkUserId(
      req.cookies?.[GOOGLE_LINK_COOKIE],
    );
    if (req.cookies?.[GOOGLE_LINK_COOKIE])
      res.clearCookie(GOOGLE_LINK_COOKIE, authCookieOptions());
    if (linkUserId) {
      if (!googleSub || !email || !emailVerified)
        return res.redirect(linkResultUrl('failed'));
      const result = await this.authService.linkGoogleAccount(
        linkUserId,
        googleSub,
        email,
      );
      if (result.status === 'linked' && result.oldEmail !== result.email)
        await notifyEmailChanged(
          this.mail,
          result.oldEmail,
          result.email,
          '다른 Google 계정으로 바꾸기',
        );
      return res.redirect(linkResultUrl(result.status));
    }

    // 유효한 사용자만 등록하도록 개선
    if (!email || !username) return res.redirect(loginFailedUrl());

    const user = await this.authService.validateOrCreateGoogleUser(
      googleSub,
      email,
      username,
      profileImg,
    );

    if (!user) return res.redirect(loginFailedUrl());

    const accessToken = await this.authService.generateAccessToken(user.id);
    // 이 기기의 세션 (다른 기기에서 로그인한 것은 그대로 둔다)
    const refreshToken = await this.authService.createSession(
      user.id,
      req.headers['user-agent'],
    );

    res.cookie(
      'access_token',
      accessToken,
      authCookieOptions(ACCESS_TOKEN_MAX_AGE),
    );

    res.cookie(
      'refresh_token',
      refreshToken,
      authCookieOptions(REFRESH_TOKEN_MAX_AGE),
    );

    res.cookie(
      SESSION_HINT_COOKIE,
      '1',
      sessionHintCookieOptions(REFRESH_TOKEN_MAX_AGE),
    );

    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(`${frontendUrl}?oauthSuccess=true`);
  }

  /**
   * Refresh Token으로 새 Access Token 발급. authGuard가 없어 만료된 Access Token도 허용.
   * refresh token도 새것으로 바꾸고(rotation) 30일을 다시 센다 → 쓰는 동안은 로그인이 풀리지 않는다
   */
  @Public()
  @Get('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    // 갱신에 실패하면 로그인 표시 쿠키도 지워, 프론트가 로그아웃 상태로 그리게 합니다.
    // 어느 단계에서 실패했는지는 응답에 싣지 않는다 (토큰을 떠보는 데 쓰일 수 있음)
    const expired = () => {
      res.clearCookie(SESSION_HINT_COOKIE, sessionHintCookieOptions());
      return new AppException('SESSION_EXPIRED');
    };

    if (!refreshToken) throw expired();

    try {
      const session = await this.authService.rotateSession(
        refreshToken,
        req.headers['user-agent'],
      );
      if (!session) throw expired();
      const { userId } = session;

      const newAccessToken = await this.authService.generateAccessToken(userId);

      res.cookie(
        'access_token',
        newAccessToken,
        authCookieOptions(ACCESS_TOKEN_MAX_AGE),
      );

      // 바로 전 토큰으로 온 늦은 탭이면 새 refresh token은 먼저 온 응답이 이미 내려 줬다
      if (session.refreshToken) {
        res.cookie(
          'refresh_token',
          session.refreshToken,
          authCookieOptions(REFRESH_TOKEN_MAX_AGE),
        );
      }

      res.cookie(
        SESSION_HINT_COOKIE,
        '1',
        sessionHintCookieOptions(REFRESH_TOKEN_MAX_AGE),
      );

      // 토큰은 HttpOnly 쿠키로만 전달합니다. (응답 본문에 담으면 스크립트에서 읽을 수 있음)
      return res.json({ message: 'Token refreshed' });
    } catch (error) {
      if (error instanceof AppException) throw error;
      throw expired();
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { id: number };
    if (!user?.id) throw new AppException('UNAUTHORIZED');

    // 이 기기의 세션만 지운다 (다른 기기 로그인은 그대로. 실패하면 ApiExceptionFilter가 500으로 기록·응답)
    await this.authService.removeSession(req.cookies['refresh_token']);

    // 쿠키 완전 삭제
    res.clearCookie('access_token', authCookieOptions());

    res.clearCookie('refresh_token', authCookieOptions());

    res.clearCookie(SESSION_HINT_COOKIE, sessionHintCookieOptions());

    return res.status(200).json({ message: 'Logged out successfully' });
  }

  /** 마이페이지 '로그인한 기기': 지금 이 기기가 맨 위(current) */
  @Get('sessions')
  async sessions(@Req() req: Request) {
    const { id } = req.user as { id: number };
    return this.authService.listSessions(id, req.cookies['refresh_token']);
  }

  /** 이 기기만 남기고 모두 로그아웃 */
  @Post('sessions/logout-others')
  async logoutOthers(@Req() req: Request) {
    const { id } = req.user as { id: number };
    const removed = await this.authService.removeOtherSessions(
      id,
      req.cookies['refresh_token'],
    );
    return { removed };
  }

  /** 다른 기기 하나 로그아웃. 그 기기는 access token이 끝나는(최대 30분) 대로 로그인이 풀린다 */
  @Delete('sessions/:id')
  async removeSession(
    @Req() req: Request,
    @Param('id', ParseIntPipe) sessionId: number,
  ) {
    const { id } = req.user as { id: number };
    const removed = await this.authService.removeSessionById(
      id,
      sessionId,
      req.cookies['refresh_token'],
    );
    if (!removed) throw new AppException('NOT_FOUND');
    return { removed };
  }
}
