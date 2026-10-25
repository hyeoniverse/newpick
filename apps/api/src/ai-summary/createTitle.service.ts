import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { MysqlPrismaService } from '../../prisma/mysql.service';

@Injectable()
export class CreateTitleService {
  constructor(
    private readonly claude: ClaudeService,
    private readonly prisma: MysqlPrismaService,
    private readonly logger: Logger,
  ) {}

  async createTitle(summary: string) {
    const startTime = Date.now();
    try {
      const { text: title, tokens } = await this.claude.generate({
        system:
          'You are an expert title creator. Create a title for the following article. Return only the title in Korean, without quotes.',
        prompt: `Create a title for the following article \n\nArticle: ${summary}`,
      });

      await this.prisma.aiProcessLog.create({
        data: {
          newsId: '',
          processType: 'title',
          result: title,
          duration: (Date.now() - startTime) / 1000,
          status: 'success',
          error: null,
          token: tokens,
        },
      });
      this.logger.debug(`제목 생성 완료: ${title}`);

      return title;
    } catch (error) {
      this.logger.error(`제목 생성 실패: ${error.message}`);
      throw new Error('Title creation failed.' + error.message);
    }
  }
}
