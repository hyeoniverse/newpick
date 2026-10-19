import { Module } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { AiSummaryController } from './ai-summary.controller';
import { CrawledNewsModule } from '../crawling/crawled-news.module';
import { FindCategoryService } from './findCategory.service';
import { CreateNewsletterService } from './createNewsletter.service';
import { CreateTitleService } from './createTitle.service';
import { BasicSummarizeService } from './basicSummarize.service';
import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { HTMLFormatterService } from './parseHtml.service';
@Module({
  imports: [CrawledNewsModule],
  controllers: [AiSummaryController],
  providers: [
    {
      provide: OpenAI,
      useValue: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }),
    },
    Logger,
    OpenAiService,
    FindCategoryService,
    CreateNewsletterService,
    CreateTitleService,
    HTMLFormatterService,
    BasicSummarizeService,
  ],
  exports: [
    OpenAiService,
    FindCategoryService,
    CreateNewsletterService,
    CreateTitleService,
    HTMLFormatterService,
    BasicSummarizeService,
    OpenAI,
    Logger,
  ],
})
export class AiSummaryModule {}
