import { Injectable } from '@nestjs/common';
import { ClaudeService } from './claude.service';

/** 뉴스레터 본문(요약) 분량. 상세 화면의 'AI 요약'과 카드 미리보기에 그대로 보입니다 (#41) */
export const SUMMARY_LENGTH = { min: 900, max: 1300 } as const;

export const SUMMARY_SYSTEM =
  'You are the editor of a Korean daily news newsletter. Write only in Korean.';

/**
 * 단어 수 대신 구조(소식 수·문장 수)와 글자 수로 분량을 정합니다.
 * 예전에는 "1000-1500 words"라고만 해서 한국어 요약이 4,000자 넘게 나왔습니다.
 */
export const summaryPrompt = (text: string, category?: string) =>
  [
    category
      ? `아래 기사들로 오늘 ${category} 분야 뉴스레터의 본문을 써 주세요.`
      : '아래 기사들로 오늘 뉴스레터의 본문을 써 주세요.',
    '',
    `- 가장 중요한 소식 3~5개만 고릅니다.${category ? ` ${category} 분야에 가까운 소식을 우선합니다.` : ''} 같은 사건을 다룬 기사는 하나로 합칩니다.`,
    '- 소식마다 한 문단, 2~3문장으로 씁니다. 문단 사이는 빈 줄 하나입니다.',
    `- 전체 ${SUMMARY_LENGTH.min}~${SUMMARY_LENGTH.max}자(공백 포함)를 넘기지 않습니다.`,
    '- 숫자·이름·날짜는 기사에 있는 그대로 쓰고, 기사에 없는 내용은 더하지 않습니다.',
    '- 제목, 소제목, 글머리 기호, 마크다운, 인사말, 맺음말은 쓰지 않습니다.',
    '',
    '기사:',
    text,
  ].join('\n');

@Injectable()
export class BasicSummarizeService {
  constructor(private readonly claude: ClaudeService) {}

  async basicSummarize(text: string, category?: string) {
    // 뉴스레터 본문이 되는 요약이라 다른 호출보다 effort를 높입니다.
    return this.claude.generate({
      system: SUMMARY_SYSTEM,
      prompt: summaryPrompt(text, category),
      effort: 'medium',
      maxTokens: 8000,
    });
  }
}
