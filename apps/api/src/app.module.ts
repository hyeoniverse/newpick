import { FollowsModule } from 'src/follows/follows.module';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { CrawlingModule } from 'src/crawling/crawling.module';
import { SchedulerModule } from 'src/scheduler/scheduler.module'; // 스케줄러 모듈
import { AdminStatsModule } from 'src/admin-stats/admin-stats.module';
import { AuthModule } from 'src/auth/auth.module'; // 인증 모듈
import { PrismaModule } from 'src/prisma/prisma.module'; // Prisma 모듈
import { AiSummaryModule } from 'src/ai-summary/ai-summary.module'; // AI 요약 모듈
import { FeedbackModule } from 'src/feedback/feedback.module'; // 피드백 모듈
import { MyPageModule } from 'src/mypage/mypage.module'; // 마이페이지 모듈
import { AdminModule } from 'src/admin/admin.module'; // 관리자 페이지 모듈
import { MailModule } from 'src/mail/mail.module'; // 메일 모듈
import { CategoryModule } from 'src/category/category.module'; // 카테고리 모듈
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApiExceptionFilter } from 'src/common/errors/api-exception.filter';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientThrottlerGuard } from 'src/common/client-throttler.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { validateEnv } from 'src/config/env.validation';
import { ScheduleModule } from '@nestjs/schedule';
import { NewsletterModule } from 'src/newsletter/newsletter.module';
import { ConfigLoggerMiddleware } from 'src/middleware/config-logger.middleware';
import { CoopMiddleware } from 'src/middleware/coop.middleware';

import { EditionModule } from 'src/edition/edition.module';
import { SiteCacheModule } from 'src/site-cache/site-cache.module';
import { ImagesModule } from 'src/images/images.module';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { env } from 'src/config/env';
import { THROTTLE } from 'src/common/throttle';
@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
			validate: validateEnv,
		}),
		// 기본 요청 제한 (common/throttle)
		ThrottlerModule.forRoot([THROTTLE.default]),
		SentryModule.forRoot(),
		MongooseModule.forRoot(env.mongoUrl), // MongoDB 연결
		CrawlingModule, // 크롤링 모듈
		SchedulerModule, // 스케줄러 모듈
		AdminStatsModule, // 관리자 통계
		AuthModule, // 인증 모듈
		AiSummaryModule, // AI 요약 모듈
		FeedbackModule, // 피드백 모듈
		AnalyticsModule, // 방문 통계 (#131)
		PrismaModule, // Prisma 모듈
		MyPageModule, // 마이페이지 모듈
		FollowsModule, // 후속 지켜보기
		AdminModule, // 관리자 페이지 모듈
		MailModule, // 메일 모듈
		CategoryModule, // 카테고리 모듈
		ScheduleModule.forRoot(),
		NewsletterModule,
		EditionModule, // 구독 메일 편집 (#55)
		SiteCacheModule, // 웹 사이트 캐시 비우기 (#73)
		ImagesModule, // 사진 줄이기 (Vercel 사진 최적화 대신)
	],
	controllers: [AppController], // 컨트롤러 등록
	providers: [
		{
			provide: APP_FILTER,
			useClass: ApiExceptionFilter, // 모든 오류를 { statusCode, code, message } 한 모양으로
		},
		// 순서대로 실행: 로그인 확인(@Public 제외) → 요청 제한. 요청 제한이 로그인한 사람을 사용자 id로 세려면
		// req.user가 먼저 있어야 한다 (common/client-throttler.guard.ts)
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
		{ provide: APP_GUARD, useClass: ClientThrottlerGuard },
	], // 서비스 등록
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		// Express 5(NestJS 11) 경로 문법: 모든 경로는 '*'가 아니라 이름 붙인 와일드카드 '{*path}'
		consumer.apply(ConfigLoggerMiddleware, CoopMiddleware).forRoutes('{*path}');
	}
}
