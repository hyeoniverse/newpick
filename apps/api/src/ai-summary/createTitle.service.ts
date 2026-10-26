import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { MysqlPrismaService } from '../../prisma/mysql.service';

export type Headline = { title: string; subtitle: string };

/** 카드에서 잘리지 않는 길이 (#42) */
export const HEADLINE_LENGTH = { title: 30, subtitle: 60 } as const;

export const HEADLINE_SYSTEM =
  'You are the headline editor of a Korean daily news newsletter. Write only in Korean.';

/**
 * 예전에는 "Create a title"뿐이라 요약에 든 소식을 모두 '·'로 이어 붙인 44~76자 제목이 나왔습니다.
 * 제목은 가장 중요한 소식 하나, 나머지는 부제목으로 나눕니다.
 */
export const headlinePrompt = (summary: string, category?: string) =>
  [
    category
      ? `아래 ${category} 분야 뉴스레터 본문의 제목과 부제목을 지어 주세요.`
      : '아래 뉴스레터 본문의 제목과 부제목을 지어 주세요.',
    '',
    `- title: 가장 중요한 소식 하나를 담은 헤드라인. ${HEADLINE_LENGTH.title}자 이내.${category ? ` ${category} 분야에 가까운 소식을 고릅니다.` : ''}`,
    '  - 여러 소식을 ·, 쉼표, "외"로 나열하지 않습니다.',
    '  - 날짜, "주요 소식", "브리핑", "뉴스 요약" 같은 말은 넣지 않습니다.',
    `- subtitle: 나머지 주요 소식을 한 문장으로. ${HEADLINE_LENGTH.subtitle}자 이내. title과 같은 내용을 반복하지 않습니다.`,
    '- 따옴표로 감싸지 않습니다. 기사에 없는 내용은 더하지 않습니다.',
    '',
    '본문:',
    summary,
  ].join('\n');

const HEADLINE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
  },
  required: ['title', 'subtitle'],
  additionalProperties: false,
};

const QUOTE = /["'“”‘’「」]/;

/**
 * 모델이 지시와 달리 제목 전체를 따옴표로 감싸 오면 걷어 냅니다.
 * 이 대통령 "땅 뺏는 것 아니다"처럼 제목 안의 인용은 그대로 둡니다
 */
export const clean = (value: string) => {
  const text = value.trim();
  const inner = text.slice(1, -1);
  const wrapped =
    text.length > 2 &&
    QUOTE.test(text[0]) &&
    QUOTE.test(text[text.length - 1]) &&
    !QUOTE.test(inner);
  return (wrapped ? inner : text).trim();
};

@Injectable()
export class CreateTitleService {
  constructor(
    private readonly claude: ClaudeService,
    private readonly prisma: MysqlPrismaService,
    private readonly logger: Logger,
  ) {}

  /** 제목과 부제목을 한 번의 호출에서 JSON으로 받습니다 */
  async createHeadline(summary: string, category?: string): Promise<Headline> {
    const startTime = Date.now();
    try {
      const { text, tokens } = await this.claude.generate({
        system: HEADLINE_SYSTEM,
        prompt: headlinePrompt(summary, category),
        schema: HEADLINE_SCHEMA,
        maxTokens: 2048,
      });
      const parsed = JSON.parse(text) as Headline;
      const headline = {
        title: clean(parsed.title),
        subtitle: clean(parsed.subtitle),
      };
      if (!headline.title) throw new Error('빈 제목');

      // 길이는 지시로만 맞추고, 넘으면 저장은 하되 기록을 남깁니다 (잘라서 문장을 깨뜨리지 않게)
      if (headline.title.length > HEADLINE_LENGTH.title) {
        this.logger.warn(
          `제목이 ${headline.title.length}자: ${headline.title}`,
        );
      }

      await this.prisma.aiProcessLog.create({
        data: {
          newsId: '',
          processType: 'title',
          result: `${headline.title} | ${headline.subtitle}`,
          duration: (Date.now() - startTime) / 1000,
          status: 'success',
          error: null,
          token: tokens,
        },
      });
      this.logger.debug(`제목 생성 완료: ${headline.title}`);

      return headline;
    } catch (error) {
      this.logger.error(`제목 생성 실패: ${error.message}`);
      throw new Error('Title creation failed.' + error.message);
    }
  }
}
