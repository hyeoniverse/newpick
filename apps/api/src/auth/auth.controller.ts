import { Controller, Get, Req, Post, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleOAuthGuard, loginFailedUrl } from './google-oauth.guard';
import { AppException } from '../common/errors/app.exception';
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  SESSION_HINT_COOKIE,
  authCookieOptions,
  sessionHintCookieOptions,
} from './cookie-options';
import { Public } from 'src/auth/decorators/auth.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleLogin() {
    return { message: 'Redirecting to Google OAuth...' };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // 브라우저가 직접 여는 주소라, 실패하면 JSON이 아니라 사이트로 돌려보낸다
    if (!req.user) return res.redirect(loginFailedUrl());

    const { googleSub, email, username, profileImg } = req.user as any;

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
    const refreshToken = await this.authService.generateRefreshToken(user.id);

    await this.authService.storeRefreshToken(user.id, refreshToken);

    // Refresh Token을 한 번만 설정
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
   * Refresh Token을 사용하여 새로운 Access Token 발급
   * authGuard를 제거하여 만료된 Access Token도 허용
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
      const userId =
        await this.authService.verifyAndDecodeRefreshToken(refreshToken);
      if (!userId) throw expired();

      // Refresh Token이 DB에 저장된 것과 일치하는지 확인
      const isTokenValid = await this.authService.verifyRefreshToken(
        userId,
        refreshToken,
      );
      if (!isTokenValid) throw expired();

      const newAccessToken = await this.authService.generateAccessToken(userId);

      res.cookie(
        'access_token',
        newAccessToken,
        authCookieOptions(ACCESS_TOKEN_MAX_AGE),
      );

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

    // Refresh Token을 DB에서 완전히 삭제 (실패하면 ApiExceptionFilter가 500으로 기록·응답)
    await this.authService.removeRefreshToken(user.id);

    // 쿠키 완전 삭제
    res.clearCookie('access_token', authCookieOptions());

    res.clearCookie('refresh_token', authCookieOptions());

    res.clearCookie(SESSION_HINT_COOKIE, sessionHintCookieOptions());

    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
