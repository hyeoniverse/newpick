import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
import { GoogleOAuthGuard } from './google-oauth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // 기본 인증 전략 설정
    MailModule, // 다른 Google 계정으로 바꾸면 예전 주소에 알림
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
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
