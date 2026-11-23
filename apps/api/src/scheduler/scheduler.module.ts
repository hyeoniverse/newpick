import { FollowsModule } from 'src/follows/follows.module';
import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ScheduleConfigService } from './schedule-config.service';
import { JobRunsService } from './job-runs.service';
import { SummaryJobService } from './summary-job.service';
import { MailJobService } from './mail-job.service';
import { SchedulerController } from './scheduler.controller';
import { DashboardController } from './dashboard.controller';
import { PublishTimeController } from './publish-time.controller';
import { DashboardService } from './dashboard.service';
import { MailModule } from 'src/mail/mail.module';
import { CrawlingModule } from 'src/crawling/crawling.module';
import { AiSummaryModule } from 'src/ai-summary/ai-summary.module';
import { SubscriberModule } from 'src/subscriber/subscriber.module';
import { CategoryModule } from 'src/category/category.module';
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
		EditionModule,
		TasteModule,
		FollowsModule,
		RecommendModule,
	],
	providers: [
		SchedulerService,
		ScheduleConfigService,
		JobRunsService,
		SummaryJobService,
		MailJobService,
		DashboardService,
	],
	controllers: [SchedulerController, DashboardController, PublishTimeController],
})
export class SchedulerModule {}
