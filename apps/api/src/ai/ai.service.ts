import { Injectable, Logger } from '@nestjs/common';
import { CLAUDE_FAST_MODEL, ClaudeService } from '../ai-summary/claude.service';
import { ClaudeUsage, costUsd } from '../ai-summary/pricing';
import { toKstDate } from '../common/kst';
import { OpenModelService, OpenModelUnavailable } from './open-model.service';

/** 오픈 모델이 안 될 때 Claude로 넘기는 비용의 하루 상한 (USD). 넘으면 넘기지 않고 실패 → 부른 쪽이 미루거나 건너뛴다 */
export const FALLBACK_DAILY_USD = Number(
  process.env.AI_FALLBACK_DAILY_USD ?? 0.1,
);

/** 오픈 모델도 Claude도 지금은 쓸 수 없음 (할당 초과 + 하루 상한 도달 등). 부른 쪽은 다음 기회로 미룬다 */
export class AiUnavailable extends Error {}

type GenerateOptions = {
  /** 어떤 일인지 (사용량 기록 · 통계, 예: scrap-analysis) */
  stage: string;
  /** open: 오픈 모델 먼저, 안 되면 Claude(빠른 모델)로. claude: 처음부터 Claude */
  prefer: 'open' | 'claude';
  system: string;
  prompt: string;
  schema?: Record<string, unknown>;
  maxTokens?: number;
  /** 오픈 모델 결과가 쓸 만한지 (JSON 형식 말고 내용 검사). false면 Claude로 넘긴다 */
  accept?: (text: string) => boolean;
  /** false면 오픈 모델이 안 될 때 Claude로 넘기지 않는다 (밤 배치처럼 미뤄도 되는 일) */
  fallback?: boolean;
};

export type AiResult = {
  text: string;
  tokens: number;
  usage: ClaudeUsage;
  provider: 'open' | 'claude';
};

/**
 * AI 호출의 공급자 고르기 (#119 2단계). 일마다 오픈 모델(무료) · Claude를 고르고,
 * 오픈 모델이 안 되거나(할당 초과 · 장애) 결과가 형식을 깨면 Claude 빠른 모델로 넘긴다 — 하루 비용 상한 안에서만.
 * 뉴스레터 본문처럼 품질이 중요한 일은 지금처럼 prefer: 'claude'
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  /** 오늘(한국 날짜) Claude로 넘긴 비용 */
  private fallbackSpend = { day: '', usd: 0 };

  constructor(
    private readonly open: OpenModelService,
    private readonly claude: ClaudeService,
  ) {}

  async generate(options: GenerateOptions): Promise<AiResult> {
    const { stage, prefer, accept, fallback = true, ...request } = options;
    if (prefer === 'claude') return this.viaClaude(stage, request);

    try {
      const result = await this.open.generate(request);
      if (request.schema) JSON.parse(result.text);
      if (accept && !accept(result.text))
        throw new Error('결과가 검사를 통과하지 못했습니다');
      return {
        text: result.text,
        tokens: result.tokens,
        usage: { ...result.usage, stage },
        provider: 'open',
      };
    } catch (error) {
      const reason = (error as Error).message;
      if (!fallback) {
        throw error instanceof OpenModelUnavailable
          ? new AiUnavailable(reason)
          : error;
      }
      if (!this.withinBudget()) {
        throw new AiUnavailable(
          `오픈 모델 실패(${reason}), Claude로 넘기는 오늘 비용 상한($${FALLBACK_DAILY_USD})에 닿음`,
        );
      }
      this.logger.warn(`${stage}: 오픈 모델 실패 → Claude로 (${reason})`);
      const result = await this.viaClaude(stage, {
        ...request,
        model: CLAUDE_FAST_MODEL,
      });
      this.spend(costUsd([result.usage]) ?? 0);
      return result;
    }
  }

  /** 문장 임베딩. Claude에는 임베딩이 없어 넘길 곳이 없다 → 안 되면 AiUnavailable (부른 쪽이 미룬다) */
  async embed(texts: string[]) {
    try {
      return await this.open.embed(texts);
    } catch (error) {
      throw error instanceof OpenModelUnavailable
        ? new AiUnavailable(error.message)
        : error;
    }
  }

  private async viaClaude(
    stage: string,
    request: Omit<
      GenerateOptions,
      'stage' | 'prefer' | 'accept' | 'fallback'
    > & {
      model?: string;
    },
  ): Promise<AiResult> {
    const result = await this.claude.generate(request);
    return { ...result, usage: { ...result.usage, stage }, provider: 'claude' };
  }

  private today() {
    const day = toKstDate(new Date());
    if (this.fallbackSpend.day !== day) this.fallbackSpend = { day, usd: 0 };
    return this.fallbackSpend;
  }

  private withinBudget() {
    return this.today().usd < FALLBACK_DAILY_USD;
  }

  private spend(usd: number) {
    this.today().usd += usd;
  }
}
