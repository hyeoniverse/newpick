import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { Public } from 'src/auth/decorators/auth.decorators';
import { CommonResponseInterceptor } from 'src/common/response.interceptor';
import { EditionService } from './edition.service';
import { HomeService } from './home.service';
import { AppException } from 'src/common/errors/app.exception';

@Controller('edition')
@UseInterceptors(CommonResponseInterceptor)
export class EditionController {
	constructor(
		private readonly editionService: EditionService,
		private readonly homeService: HomeService,
	) {}

	/**
	 * 홈 '오늘' 묶음: 오늘의 3줄 · 오늘의 트렌드 · 분야를 넘는 흐름 · 지금 뜨는 태그 · 많이 읽은 · 많이 스크랩한.
	 * 이미 만든 편집본과 조회 · 스크랩 · 태그로 모은다 (AI 호출 없음, 5분 동안 같은 결과)
	 */
	@Public()
	@Get('today')
	async today() {
		const today = await this.homeService.today();
		if (!today) throw new AppException('EDITION_NOT_FOUND');
		return today;
	}

	/**
	 * 체험하기: 고른 분야로 받게 될 메일을 실제 메일과 같은 HTML로 (#55).
	 * 이미 만든 최신 발행본과 편집본만 쓴다 (AI 호출 없음). categories: 분야 id, 쉼표로 구분
	 */
	@Public()
	@Get('preview')
	async preview(@Query('categories') categories = '') {
		const interests = [...new Set(categories.split(',').filter(Boolean).map(Number))];
		if (!interests.length || interests.some((n) => !Number.isInteger(n))) {
			throw new AppException('BAD_REQUEST', '분야 id를 쉼표로 구분해 주십시오.');
		}
		const edition = await this.editionService.latestEdition();
		const mail = edition && this.editionService.composeMail(edition, interests);
		if (!mail) throw new AppException('EDITION_NOT_FOUND');
		return { date: edition.date, subject: mail.subject, html: mail.html };
	}
}
