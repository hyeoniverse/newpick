import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { StoryLinksService } from './story-links.service';

/** 후속 지켜보기: 소식을 지켜보다 이어지는 새 소식이 나오면 쌓고 알린다. 이어지는 이야기(날짜를 넘어 같은 사건 잇기)도 같은 판정 방식으로 */
@Module({
	imports: [AiModule],
	controllers: [FollowsController],
	providers: [FollowsService, StoryLinksService],
	exports: [FollowsService, StoryLinksService],
})
export class FollowsModule {}
