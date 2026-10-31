import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { DashboardService } from './dashboard.service';
import { StatsService } from './stats.service';
import { MailModule } from 'src/mail/mail.module';
import { CrawlingModule } from 'src/crawling/crawling.module';
import { AiSummaryModule } from 'src/ai-summary/ai-summary.module';
import { SubscriberModule } from 'src/subscriber/subscriber.module';
import { CategoryModule } from 'src/category/category.module';
import { BasicRepositoryModule } from 'src/repository/module';
import { EditionModule } from 'src/edition/edition.module';
import { TasteModule } from 'src/taste/taste.module';
import { RecommendModule } from 'src/recommend/recommend.module';

@Module({
  imports: [
    MailModule,
    CrawlingModule,
    AiSummaryModule,
    SubscriberModule,
    CategoryModule,
    BasicRepositoryModule,
    EditionModule,
    TasteModule,
    RecommendModule,
  ],
  providers: [SchedulerService, DashboardService, StatsService],
  controllers: [SchedulerController],
})
export class SchedulerModule {}
