import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { MysqlPrismaService } from '../../prisma/mysql.service';

@Injectable()
export class FindCategoryService {
  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly claude: ClaudeService,
    private readonly logger: Logger,
  ) {}

  async findCategory(summary: string) {
    const startTime = Date.now();
    try {
      const categoryList = await this.prisma.newsCategory.findMany();

      const names = categoryList.map((item) => item.name);

      // 응답을 카테고리 이름 중 하나로 제한해, DB에 없는 이름이 돌아오지 않게 합니다.
      const { text, tokens } = await this.claude.generate({
        system:
          'You are an expert category classifier. Classify the following article into the provided category list',
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
      const categoryId = categoryList.find(
        (item) => item.name === categoryName,
      )?.id;

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
        },
      });

      this.logger.debug(`카테고리 찾기 완료: ${categoryName}`);

      return {
        categoryId: categoryId,
        categoryName: categoryName,
      };
    } catch (error) {
      this.logger.error(`카테고리 찾기 실패: ${error.message}`);
      await this.prisma.aiProcessLog.create({
        data: {
          newsId: '',
          processType: 'category',
          result: error.message,
          duration: 0,
          status: 'error',
          error: error.message,
          token: 0,
        },
      });
    }
  }
}
