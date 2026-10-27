import { Global, Module } from '@nestjs/common';
import { SiteCacheService } from './site-cache.service';

/** 어디서나 SiteCacheService를 쓸 수 있게 전역으로 (뉴스레터 생성·삭제·관리자) */
@Global()
@Module({
  providers: [SiteCacheService],
  exports: [SiteCacheService],
})
export class SiteCacheModule {}
