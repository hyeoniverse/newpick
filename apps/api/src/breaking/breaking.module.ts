import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module';
import { MailModule } from 'src/mail/mail.module';
import { BreakingAdminController, BreakingController } from './breaking.controller';
import { BreakingService } from './breaking.service';
import { BreakingSendService } from './breaking-send.service';

/** 속보 뉴스레터: 매시 수집 뒤 판정 · 자동 발송 예약(취소할 시간) · 메일 보내기 · 홈 속보 띠 · 지난 속보 */
@Module({
	imports: [AiModule, MailModule],
	controllers: [BreakingAdminController, BreakingController],
	providers: [BreakingService, BreakingSendService],
	exports: [BreakingService, BreakingSendService],
})
export class BreakingModule {}
