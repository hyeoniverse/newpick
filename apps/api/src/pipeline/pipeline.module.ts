import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { PipelineController } from './pipeline.controller';
import { PipelineLiveService } from './pipeline-live.service';

/** 홈 '지금 뉴픽은': 수집 · 뉴스레터 만들기 과정 */
@Module({
	imports: [AiModule],
	controllers: [PipelineController],
	providers: [PipelineLiveService],
	exports: [PipelineLiveService],
})
export class PipelineModule {}
