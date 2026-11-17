import { AppException } from 'src/common/errors/app.exception';
import { Controller, Get, Param, UseInterceptors, Query } from '@nestjs/common';
import { CrawlingService } from './crawling.service';
import { CrawlingRepository } from './crawling.repository';
import { CommonResponseInterceptor } from 'src/common/response.interceptor';
import { CategoryRepository } from 'src/category/category.repository';
import { AdminOnly, Public } from 'src/auth/decorators/auth.decorators';
@Controller('crawling')
@UseInterceptors(CommonResponseInterceptor)
export class CrawlingController {
	constructor(
		private readonly crawlingService: CrawlingService,
		private readonly crawlingRepository: CrawlingRepository,
		private readonly categoryRepository: CategoryRepository,
	) {}

	@AdminOnly()
	@Get()
	async getCrawledNewsForTest() {
		const news = await this.crawlingRepository.getLatestCrawledNews();
		const oldNews = await this.crawlingRepository.getOldestCrawledNews();
		const newsCountperCategory = await this.crawlingRepository.getNewsCountPerCategory();
		return {
			message: '크롤링 데이터 조회 성공',
			data: {
				// 수집한 기사가 하나도 없으면 null (예전엔 null.createdAt로 500)
				news: news?.createdAt ?? null,
				oldNews: oldNews?.createdAt ?? null,
				newsCountperCategory,
			},
		};
	}

	@Public()
	@Get('link')
	async getCrawledNewsByLink(@Query('link') link: string) {
		const news = await this.crawlingRepository.getCrawledNewsByLink(link);
		return {
			message: '크롤링 데이터 조회 성공',
			data: news,
		};
	}

	@AdminOnly()
	@Get('category/:categoryId')
	async getCrawledNewsByCategory(@Param('categoryId') categoryId: number) {
		const categoryName = await this.categoryRepository.findById(categoryId);
		// 없는 분야면 404 (예전엔 null.name으로 500)
		if (!categoryName) throw new AppException('CATEGORY_NOT_FOUND');
		return {
			message: '카테고리별 크롤링 데이터 조회 성공',
			data: await this.crawlingRepository.getCrawledNewsByCategory(categoryName.name),
		};
	}
}
