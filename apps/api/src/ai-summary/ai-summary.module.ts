import { Module } from '@nestjs/common';
import { AiSummaryService } from './ai-summary.service';
import { AiSummaryController } from './ai-summary.controller';
import { CrawledNewsModule } from '../crawling/crawled-news.module';
import { CreateNewsletterService } from './create-newsletter.service';
import { NewsletterWriterService } from './newsletter-writer.service';
import { StoryImageService } from './story-images';
import { Logger } from '@nestjs/common';
import { TagsModule } from '../tags/tags.module';
import { LlmModule } from '../llm/llm.module';
import { CategoryModule } from '../category/category.module';
@Module({
  imports: [CrawledNewsModule, TagsModule, LlmModule, CategoryModule],
  controllers: [AiSummaryController],
  providers: [
    Logger,
    AiSummaryService,
    CreateNewsletterService,
    NewsletterWriterService,
    StoryImageService,
  ],
  exports: [
    AiSummaryService,
    CreateNewsletterService,
    NewsletterWriterService,
    Logger,
  ],
})
export class AiSummaryModule {}
