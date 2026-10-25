import { Module } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AiSummaryService } from './ai-summary.service';
import { ClaudeService } from './claude.service';
import { AiSummaryController } from './ai-summary.controller';
import { CrawledNewsModule } from '../crawling/crawled-news.module';
import { FindCategoryService } from './findCategory.service';
import { CreateNewsletterService } from './createNewsletter.service';
import { CreateTitleService } from './createTitle.service';
import { BasicSummarizeService } from './basicSummarize.service';
import { Logger } from '@nestjs/common';
import { HTMLFormatterService } from './parseHtml.service';
@Module({
  imports: [CrawledNewsModule],
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
    CreateTitleService,
    HTMLFormatterService,
    BasicSummarizeService,
  ],
  exports: [
    AiSummaryService,
    ClaudeService,
    FindCategoryService,
    CreateNewsletterService,
    CreateTitleService,
    HTMLFormatterService,
    BasicSummarizeService,
    Logger,
  ],
})
export class AiSummaryModule {}
