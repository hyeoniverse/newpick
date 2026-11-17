import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TagsModule } from 'src/tags/tags.module';
import { CrawledNewsModule } from 'src/crawling/crawled-news.module';

@Module({
  imports: [TagsModule, CrawledNewsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
