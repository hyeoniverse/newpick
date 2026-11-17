import { Module } from '@nestjs/common';
import { AiSummaryService } from './ai-summary.service';
import { AiSummaryController } from './ai-summary.controller';
import { CrawledNewsModule } from 'src/crawling/crawled-news.module';
import { CreateNewsletterService } from './create-newsletter.service';
import { NewsletterWriterService } from './newsletter-writer.service';
import { StoryImageService } from './story-images';
import { TagsModule } from 'src/tags/tags.module';
import { LlmModule } from 'src/llm/llm.module';
import { CategoryModule } from 'src/category/category.module';
@Module({
  imports: [CrawledNewsModule, TagsModule, LlmModule, CategoryModule],
  controllers: [AiSummaryController],
  providers: [
    AiSummaryService,
    CreateNewsletterService,
    NewsletterWriterService,
    StoryImageService,
  ],
  exports: [AiSummaryService, CreateNewsletterService, NewsletterWriterService],
})
export class AiSummaryModule {}
