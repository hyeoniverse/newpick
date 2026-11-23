import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { AdminOnly, Public } from 'src/auth/decorators/auth.decorators';
import type { AuthedRequest } from 'src/auth/authed-request';
import { BreakingService } from './breaking.service';

class BreakingAutoDto {
	@IsBoolean()
	auto!: boolean;
}

/** 관리자 › 속보: 속보 보기 · 보내지 않기 · 지금 바로 보내기 · 자동 발송 켜기 · 끄기 */
@AdminOnly()
@Controller('admin/breaking')
export class BreakingAdminController {
	constructor(private readonly breaking: BreakingService) {}

	@Get()
	async view() {
		return { message: '속보 조회 성공', data: await this.breaking.adminView() };
	}

	@Post(':id/cancel')
	@HttpCode(200)
	async cancel(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedRequest) {
		return {
			message: '이 속보는 보내지 않습니다.',
			data: await this.breaking.decide(id, 'cancel', Number(req.user?.id)),
		};
	}

	@Post(':id/send')
	@HttpCode(200)
	async send(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedRequest) {
		return { message: '속보를 지금 보냅니다.', data: await this.breaking.decide(id, 'send', Number(req.user?.id)) };
	}

	@Put('auto')
	async setAuto(@Body() body: BreakingAutoDto) {
		return {
			message: body.auto ? '속보 자동 발송을 켰습니다.' : '속보 자동 발송을 껐습니다.',
			data: await this.breaking.setAuto(body.auto),
		};
	}
}

/** 홈 속보 띠 (누구나): 나간 속보 가운데 가장 최근 것, 없으면 null */
@Controller('breaking')
export class BreakingController {
	constructor(private readonly breaking: BreakingService) {}

	@Public()
	@Get('latest')
	async latest() {
		return { message: '속보 조회 성공', data: await this.breaking.latestNotice() };
	}
}
