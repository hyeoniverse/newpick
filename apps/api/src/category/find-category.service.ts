import { usageLog } from 'src/llm/pricing';
import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService, CLAUDE_FAST_MODEL } from 'src/llm/claude.service';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { errorMessage } from 'src/common/error-message';

@Injectable()
export class FindCategoryService {
	private readonly logger = new Logger(FindCategoryService.name);

	constructor(
		private readonly prisma: MysqlPrismaService,
		private readonly claude: ClaudeService,
	) {}

	async findCategory(summary: string) {
		const startTime = Date.now();
		try {
			const categoryList = await this.prisma.newsCategory.findMany();

			const names = categoryList.map((item) => item.name);

			// 응답을 카테고리 이름 중 하나로 제한해, DB에 없는 이름이 돌아오지 않게 합니다.
			// 정해진 목록에서 하나를 고르는 분류라 가벼운 모델로 충분합니다 (크롤링한 기사마다 호출)
			const { text, tokens, usage } = await this.claude.generate({
				model: CLAUDE_FAST_MODEL,
				system: 'You are an expert category classifier. Classify the following article into the provided category list',
				prompt: `Classify the following article into the provided category list\n\nArticle: ${summary}\n\ncategory list: ${names.toString()}`,
				schema: {
					type: 'object',
					properties: { category: { type: 'string', enum: names } },
					required: ['category'],
					additionalProperties: false,
				},
				maxTokens: 1024,
			});

			const categoryName: string = JSON.parse(text).category;
			const categoryId = categoryList.find((item) => item.name === categoryName)?.id;

			const duration = (Date.now() - startTime) / 1000;

			await this.prisma.aiProcessLog.create({
				data: {
					newsId: '',
					processType: 'category',
					result: categoryName,
					duration: duration,
					status: 'success',
					error: null,
					token: tokens,
					...usageLog([usage], 'category'),
				},
			});

			this.logger.debug(`카테고리 찾기 완료: ${categoryName}`);

			return {
				categoryId: categoryId,
				categoryName: categoryName,
			};
		} catch (error) {
			this.logger.error(`카테고리 찾기 실패: ${errorMessage(error)}`);
			await this.prisma.aiProcessLog.create({
				data: {
					newsId: '',
					processType: 'category',
					result: errorMessage(error),
					duration: 0,
					status: 'error',
					error: errorMessage(error),
					token: 0,
				},
			});
		}
	}
}
