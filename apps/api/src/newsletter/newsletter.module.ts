import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterRepo } from './newsletter.repository';

/** 발행한 뉴스레터 읽기 · 검색 · 키워드 · 관리 (/newsletters). 예전 repository 모듈에서 떼어 냄 (#199) */
@Module({
  providers: [NewsletterRepo],
  controllers: [NewsletterController],
  exports: [NewsletterRepo],
})
export class NewsletterModule {}
