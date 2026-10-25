import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService } from './claude.service';

@Injectable()
export class HTMLFormatterService {
  constructor(
    private readonly claude: ClaudeService,
    private readonly logger: Logger,
  ) {}

  async formatHtml(string: string) {
    try {
      const { text } = await this.claude.generate({
        system:
          'You are an expert html formatter. Format the following summarized article and return the content as a readable, visual html the language is Korean. Return only the HTML, without code fences or explanations.',
        prompt: `Format the following summarized article and return the content as a html wrapped in <div> tag \n\nArticle: \n\n${string}`,
      });

      // 지시와 달리 코드 블록으로 감싸 오는 경우를 대비합니다.
      const html = text.replace(/^```(?:html)?\s*|\s*```$/g, '');
      this.logger.debug(`HTML 포맷 완료: ${html.length}자`);

      return html;
    } catch (error) {
      this.logger.error(`HTML 포맷 실패: ${error.message}`);
      throw new Error('HTML 포맷 실패.' + error.message);
    }
  }
}
