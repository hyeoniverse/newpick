import { Injectable } from '@nestjs/common';
import { ClaudeService } from './claude.service';

@Injectable()
export class BasicSummarizeService {
  constructor(private readonly claude: ClaudeService) {}

  async basicSummarize(
    text: string,
    minOutputText: number,
    maxOutputText: number,
  ) {
    // 뉴스레터 본문이 되는 요약이라 다른 호출보다 effort를 높입니다.
    return this.claude.generate({
      system: 'You are an expert summarizer. Summarize articles into Korean',
      prompt: `Summarize the following text into a concise paragraph of ${minOutputText}-${maxOutputText} words:\n\n${text}`,
      effort: 'medium',
    });
  }
}
