import { Module } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AiSummaryService } from './ai-summary.service';
import { ClaudeService } from './claude.service';
import { AiSummaryController } from './ai-summary.controller';
import { CrawledNewsModule } from '../crawling/crawled-news.module';
import { FindCategoryService } from './findCategory.service';
import { CreateNewsletterService } from './createNewsletter.service';
import { NewsletterWriterService } from './newsletterWriter.service';
import { StoryImageService } from './storyImages';
import { Logger } from '@nestjs/common';
import { TagsModule } from '../tags/tags.module';
import { OpenModelService } from '../ai/open-model.service';
@Module({
  imports: [CrawledNewsModule, TagsModule],
  controllers: [AiSummaryController],
  providers: [
    {
      // ANTHROPIC_API_KEY를 읽습니다.
      provide: Anthropic,
      useFactory: () => new Anthropic(),
    },
    Logger,
    ClaudeService,
    AiSummaryService,
    FindCategoryService,
    CreateNewsletterService,
    NewsletterWriterService,
    StoryImageService,
    // 같은 사건 묶기용 임베딩 (상태 없는 클라이언트라 AiModule과 따로 둬도 된다)
    OpenModelService,
  ],
  exports: [
    AiSummaryService,
    ClaudeService,
    FindCategoryService,
    CreateNewsletterService,
    NewsletterWriterService,
    Logger,
  ],
})
export class AiSummaryModule {}
