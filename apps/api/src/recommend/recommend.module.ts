import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CrawledNewsModule } from '../crawling/crawled-news.module';
import { RecommendService } from './recommend.service';

/** 추천 기사: 북마크 · 스크랩과 뜻이 가까운 오늘 기사 (맞춤 메일에 싣는다) */
@Module({
  imports: [AiModule, CrawledNewsModule],
  providers: [RecommendService],
  exports: [RecommendService],
})
export class RecommendModule {}
