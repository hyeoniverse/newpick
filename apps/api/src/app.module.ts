import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlingModule } from './crawling/crawling.module';
import { SchedulerModule } from './scheduler/scheduler.module'; // 스케줄러 모듈
import { AuthModule } from './auth/auth.module'; // 인증 모듈
import { PrismaModule } from '../prisma/prisma.module'; // Prisma 모듈
import { AiSummaryModule } from './ai-summary/ai-summary.module'; // AI 요약 모듈
import { FeedbackModule } from './feedback/feedback.module'; // 피드백 모듈
import { MyPageModule } from './mypage/mypage.module'; // 마이페이지 모듈
import { AdminModule } from './admin/admin.module'; // 관리자 페이지 모듈
import { MailModule } from './mail/mail.module'; // 메일 모듈
import { CategoryModule } from './category/category.module'; // 카테고리 모듈
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { validateEnv } from './config/env.validation';
import { ScheduleModule } from '@nestjs/schedule';
import { BasicRepositoryModule } from './repository/module';
import { ConfigLoggerMiddleware } from './middleware/config-logger.middleware';
import { CoopMiddleware } from './middleware/coop.middleware';
// import { CommonResponseInterceptor } from './common/response.interceptor';

import { EditionModule } from './edition/edition.module';
import { SiteCacheModule } from './site-cache/site-cache.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    // 기본 요청 제한: IP당 1분에 120회
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    SentryModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL), // MongoDB 연결
    CrawlingModule, // 크롤링 모듈
    SchedulerModule, // 스케줄러 모듈
    AuthModule, // 인증 모듈
    AiSummaryModule, // AI 요약 모듈
    FeedbackModule, // 피드백 모듈
    PrismaModule, // Prisma 모듈
    MyPageModule, // 마이페이지 모듈
    AdminModule, // 관리자 페이지 모듈
    MailModule, // 메일 모듈
    CategoryModule, // 카테고리 모듈
    ScheduleModule.forRoot(),
    BasicRepositoryModule,
    EditionModule, // 구독 메일 편집 (#55)
    SiteCacheModule, // 웹 사이트 캐시 비우기 (#73)
  ],
  controllers: [AppController], // 컨트롤러 등록
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter, // 모든 오류를 { statusCode, code, message } 한 모양으로
    },
    // 순서대로 실행: 요청 제한 → 로그인 확인(@Public 제외)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 인터셉터 등록 (이부분은 나중에 추가해야함 response 형식 전부 변경됨)
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CommonResponseInterceptor,
    // },
  ], // 서비스 등록
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ConfigLoggerMiddleware, CoopMiddleware).forRoutes('*');
  }
}
