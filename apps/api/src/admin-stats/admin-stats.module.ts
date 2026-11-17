import { Module } from '@nestjs/common';
import { TasteModule } from 'src/taste/taste.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

/** 관리자 통계 (#199에서 scheduler 모듈에서 떼어 냄). 예약 작업과 관계없이 DB를 읽어 모은다 */
@Module({
  imports: [TasteModule],
  providers: [StatsService],
  controllers: [StatsController],
})
export class AdminStatsModule {}
