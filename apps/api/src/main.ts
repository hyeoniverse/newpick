import './instruments';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'; // 쿠키파서 추가(리프레시토큰용)
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 환경 변수 및 기본값 설정
  const frontendUrl: string = configService.get<string>('FRONTEND_URL');
  const port: number = configService.get<number>('PORT', 3001);

  // 쿠키 파서 미들웨어 적용
  app.use(cookieParser());

  // CORS 설정
  app.enableCors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 서버 실행
  await app.listen(port, '0.0.0.0'); // 0.0.0.0으로 외부 네트워크 수신 허용
  console.log(`서버 작동 on http://0.0.0.0:${port}`);
}
// 시작에 실패하면 프로세스를 종료해, 포트를 열지 못한 채 살아 있는 상태가 되지 않게 합니다.
bootstrap().catch((error) => {
  console.error('서버 시작 실패:', error);
  process.exit(1);
});
