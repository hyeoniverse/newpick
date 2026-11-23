import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { MailModule } from 'src/mail/mail.module';
import { BreakingController } from './breaking.controller';
import { BreakingService } from './breaking.service';

/** 속보 뉴스레터: 매시 수집 뒤 후보 판정 · 관리자 확인 */
@Module({
	imports: [AiModule, MailModule],
	controllers: [BreakingController],
	providers: [BreakingService],
	exports: [BreakingService],
})
export class BreakingModule {}
