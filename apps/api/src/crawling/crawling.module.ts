import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CrawlingService } from './crawling.service';
import { CrawlingController } from './crawling.controller';
import { CrawledNewsModule } from './crawled-news.module';
import { CategoryModule } from 'src/category/category.module';

@Module({
	imports: [CrawledNewsModule, CategoryModule],
	providers: [CrawlerService, CrawlingService],
	exports: [CrawlingService, CrawledNewsModule],
	controllers: [CrawlingController],
})
export class CrawlingModule {}
