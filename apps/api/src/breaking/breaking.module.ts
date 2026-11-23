import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { MailModule } from 'src/mail/mail.module';
import { BreakingAdminController, BreakingController } from './breaking.controller';
import { BreakingService } from './breaking.service';

/** 속보 뉴스레터: 매시 수집 뒤 판정 · 자동 발송 예약(취소할 시간) · 홈 속보 띠 */
@Module({
	imports: [AiModule, MailModule],
	controllers: [BreakingAdminController, BreakingController],
	providers: [BreakingService],
	exports: [BreakingService],
})
export class BreakingModule {}
