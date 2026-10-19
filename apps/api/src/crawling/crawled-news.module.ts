import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from 'src/category/category.module';
import { CrawlingRepository } from './crawling.repository';
import { CrawledNews, CrawledNewsSchema } from './schema/crawling.schema';

/**
 * 크롤링 원문(MongoDB) 저장소. 크롤링 모듈과 AI 요약 모듈이 모두 읽기 때문에
 * 따로 분리해 두 모듈이 서로를 import하던 순환 의존성을 없앴습니다.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CrawledNews.name, schema: CrawledNewsSchema },
    ]),
    CategoryModule,
  ],
  providers: [CrawlingRepository],
  exports: [CrawlingRepository],
})
export class CrawledNewsModule {}
