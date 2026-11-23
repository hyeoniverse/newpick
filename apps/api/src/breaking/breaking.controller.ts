import { Controller, Get, HttpCode, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';
import type { AuthedRequest } from 'src/auth/authed-request';
import { BreakingService } from './breaking.service';

/** 관리자 › 속보: 후보 보기 · 승인 · 기각 (승인해도 아직 보내지 않는다, 발송은 2단계) */
@AdminOnly()
@Controller('admin/breaking')
export class BreakingController {
	constructor(private readonly breaking: BreakingService) {}

	@Get()
	async list() {
		return { message: '속보 후보 조회 성공', data: await this.breaking.list() };
	}

	@Post(':id/approve')
	@HttpCode(200)
	async approve(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedRequest) {
		return { message: '속보를 승인했습니다.', data: await this.breaking.decide(id, 'approve', Number(req.user?.id)) };
	}

	@Post(':id/reject')
	@HttpCode(200)
	async reject(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedRequest) {
		return {
			message: '속보 후보를 기각했습니다.',
			data: await this.breaking.decide(id, 'reject', Number(req.user?.id)),
		};
	}
}
