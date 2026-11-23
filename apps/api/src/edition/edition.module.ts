import { Module } from '@nestjs/common';
import { LlmModule } from 'src/llm/llm.module';
import { AiModule } from 'src/ai/ai.module';
import { EditionController } from './edition.controller';
import { EditionService } from './edition.service';
import { HomeService } from './home.service';

/** 구독 메일 한 통 엮기: 하루 한 번 편집 + 구독자별 조합 (#55) */
@Module({
	imports: [LlmModule, AiModule],
	controllers: [EditionController],
	providers: [EditionService, HomeService],
	exports: [EditionService],
})
export class EditionModule {}
