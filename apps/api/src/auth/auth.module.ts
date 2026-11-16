import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { MailModule } from '../mail/mail.module';
import { GoogleOAuthGuard } from './google-oauth.guard';
import { env } from '../config/env';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // 기본 인증 전략 설정
    MailModule, // 다른 Google 계정으로 바꾸면 예전 주소에 알림
    JwtModule.registerAsync({
      // 함수로 두어 .env를 읽은 뒤에 값을 가져온다
      useFactory: () => ({
        secret: env.jwtSecret,
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, // 인증 서비스
    JwtStrategy, // JWT 인증 전략
    GoogleStrategy, // Google OAuth 전략
    GoogleOAuthGuard, // Google 로그인 · 계정 바꾸기 가드 (JwtService를 받음)
  ],
  exports: [
    AuthService, // AuthService를 다른 모듈에서 사용 가능
    JwtModule, // JwtModule을 다른 모듈에서 사용 가능
  ],
})
export class AuthModule {}
