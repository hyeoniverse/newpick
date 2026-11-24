import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/decorators/auth.decorators';
import { PipelineLiveService } from './pipeline-live.service';

/** 홈 '지금 뉴픽은' (누구나): 마지막(또는 지금 도는) 수집 · 뉴스레터 만들기. 도는 동안 브라우저가 몇 초마다 묻는다 */
@Public()
@Controller('pipeline')
export class PipelineController {
	constructor(private readonly pipeline: PipelineLiveService) {}

	@Get('live')
	async live() {
		return { message: '과정 조회 성공', data: await this.pipeline.live() };
	}
}
