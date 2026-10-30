import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';

/** 후속 지켜보기: 소식을 지켜보다 이어지는 새 소식이 나오면 쌓고 알린다 */
@Module({
  imports: [AiModule],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
