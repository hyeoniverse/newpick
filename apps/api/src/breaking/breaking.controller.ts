import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, Req } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { AdminOnly, Public } from 'src/auth/decorators/auth.decorators';
import type { AuthedRequest } from 'src/auth/authed-request';
import { AppException } from 'src/common/errors/app.exception';
import { verifyUnsubscribeToken } from 'src/subscriber/unsubscribe-token';
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

/**
 * 누구나: 홈 속보 띠(latest) · 지난 속보(목록 · 하나) · 메일의 '속보만 받지 않기'(off, 로그인 없이 토큰으로).
 * off: GET은 확인 화면용(아무것도 바꾸지 않음), POST가 끈다 (메일 앱의 원클릭 단추 RFC 8058 · 확인 화면의 단추)
 */
@Public()
@Controller('breaking')
export class BreakingController {
	constructor(private readonly breaking: BreakingService) {}

	@Get('latest')
	async latest() {
		return { message: '속보 조회 성공', data: await this.breaking.latestNotice() };
	}

	@Get('off')
	async offTarget(@Query('token') token: string) {
		const target = await this.breaking.offTarget(userIdFrom(token));
		if (!target) throw new AppException('UNSUBSCRIBE_LINK_INVALID');
		return { message: '속보 메일 받지 않기 대상', data: target };
	}

	@Post('off')
	@HttpCode(200)
	async turnOff(@Query('token') token: string) {
		return { message: '속보 메일을 받지 않습니다.', data: await this.breaking.turnOff(userIdFrom(token)) };
	}

	@Get()
	async archive() {
		return { message: '지난 속보 조회 성공', data: await this.breaking.archive() };
	}

	@Get(':id')
	async archiveItem(@Param('id', ParseIntPipe) id: number) {
		return { message: '속보 조회 성공', data: await this.breaking.archiveItem(id) };
	}
}

const userIdFrom = (token: string) => {
	const userId = verifyUnsubscribeToken(token, 'breaking-off');
	if (userId === null) throw new AppException('UNSUBSCRIBE_LINK_INVALID');
	return userId;
};
