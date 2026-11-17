import { Injectable, Logger } from '@nestjs/common';
import { OpenModelService } from '../llm/open-model.service';
import { ClaudeService, CLAUDE_FAST_MODEL } from '../llm/claude.service';
import {
  clusterArticles,
  embeddingText,
  prepare,
  PrepArticle,
  selectCandidates,
} from './article-prep';
import { kstStamp } from '../common/kst';
import { UsageError, usageOf } from '../llm/pricing';
import { SELECT_SCHEMA, WRITER_SCHEMA } from './writer/schema';
import {
  alignScores,
  ClusterScore,
  describeScores,
  pickArticles,
  splitPicks,
} from './writer/select';
import {
  SELECT_MAX_TOKENS,
  SELECT_SYSTEM,
  selectPrompt,
} from './writer/select-prompt';
import { markMorning, normalize } from './writer/normalize';
import { SourceArticle, Usage, WrittenNewsletter } from './writer/types';
import { WRITER_SYSTEM, writerPrompt } from './writer/write-prompt';

/**
 * 기사 → 뉴스레터 한 편의 실행 흐름 (#48). 각 단계의 내용은 writer/ 아래:
 * types(모양 · 한도) · select-prompt / write-prompt(프롬프트) · schema(응답 스키마) · select(고르기 결과) · normalize(응답 정리)
 */
@Injectable()
export class NewsletterWriterService {
  private readonly logger = new Logger(NewsletterWriterService.name);

  constructor(
    private readonly claude: ClaudeService,
    private readonly open: OpenModelService,
  ) {}

  /**
   * 같은 사건 묶기용 임베딩 (bge-m3, 무료 할당 안). 설정이 없거나 할당 초과 · 장애면 null → 제목으로만 묶는다
   * (뉴스레터는 멈추지 않는다). 한 번에 50건씩
   */
  private async embeddings(articles: PrepArticle[]) {
    if (!this.open.configured || articles.length < 2) return null;
    try {
      const vectors: number[][] = [];
      for (let i = 0; i < articles.length; i += 50) {
        vectors.push(
          ...(await this.open.embed(
            articles.slice(i, i + 50).map(embeddingText),
          )),
        );
      }
      return vectors;
    } catch (error) {
      this.logger.warn(
        `같은 사건 묶기 임베딩 실패, 제목으로만 묶음: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * 기사 → 뉴스레터 한 편.
   * 1. 전처리: 상투 문구 제거, 길이 제한, 같은 사건 묶기 (호출 없음)
   * 2. 고르기: 가벼운 모델에 묶음의 제목·첫 부분만 → 주요 소식 번호 (묶음이 하나면 건너뜀)
   * 3. 쓰기: 기본 모델에 고른 소식의 대표 기사만 → 제목·요약·본문 JSON
   */
  async write(
    articles: SourceArticle[],
    category?: string,
    hints: {
      existingTags?: string[];
      recentTopics?: string[];
      /** 뉴스레터 날짜 (프롬프트의 '오늘') */
      today?: Date;
      /** 이 시각 이후 보도는 '오늘 아침 속보'로 따로 (없으면 나누지 않는다) */
      morningSince?: Date;
    } = {},
  ) {
    const {
      existingTags = [],
      recentTopics = [],
      today = new Date(),
      morningSince,
    } = hints;
    const prepared = prepare(
      articles,
      morningSince ? kstStamp(morningSince) : undefined,
    );
    const vectors = await this.embeddings(prepared);
    // 묶음이 많은 날은 큰 묶음부터 추린다 (고르기 응답이 묶음 수만큼 길어진다)
    const clusters = selectCandidates(
      clusterArticles(prepared, vectors ?? undefined),
    );
    const usage: Usage[] = [];
    // 실패해도 그때까지 쓴 사용량(끝난 호출 + 실패한 호출에서 받은 데까지)을 오류에 실어 보낸다
    const call = async (
      stage: string,
      options: Parameters<ClaudeService['generate']>[0],
    ) => {
      try {
        return await this.claude.generate(options);
      } catch (error) {
        throw new UsageError(
          (error as Error).message,
          [...usage, ...usageOf(error).map((u) => ({ ...u, stage }))],
          { cause: error },
        );
      }
    };
    try {
      let chosen = clusters.length === 1 ? clusters[0].articles : [];
      // 오늘 아침 속보로 고른 기사 (묶음마다 1건). 본문 소식과 따로 쓴다
      let morning: PrepArticle[] = [];
      // 고르기 점수 요약 (AI 기록에 남긴다). 묶음이 하나면 고르지 않아 비어 있다
      let selection = '';
      if (!chosen.length) {
        const selected = await call('select', {
          model: CLAUDE_FAST_MODEL,
          system: SELECT_SYSTEM,
          prompt: selectPrompt(clusters, category, recentTopics, today),
          schema: SELECT_SCHEMA,
          effort: 'low',
          maxTokens: SELECT_MAX_TOKENS,
        });
        usage.push({ ...selected.usage, stage: 'select' });
        const raw = JSON.parse(selected.text) as {
          scores: ClusterScore[];
        };
        // 번호와 제목이 어긋난 점수는 바로잡거나 버린다
        const { scores, fixed, dropped } = alignScores(clusters, raw.scores);
        const picks = splitPicks(clusters, scores);
        selection =
          describeScores(clusters, scores, [
            ...picks.stories,
            ...picks.morning,
          ]) +
          (fixed || dropped
            ? `\n(번호와 제목이 어긋난 점수: 바로잡음 ${fixed} · 버림 ${dropped})`
            : '');
        chosen = pickArticles(clusters, picks.stories, category);
        morning = pickArticles(clusters, picks.morning, category, 1);
        if (!chosen.length) throw new Error('고른 소식이 없음');
      }

      // 뉴스레터 본문이 되는 호출이라 effort를 높입니다.
      const written = await call('write', {
        system: WRITER_SYSTEM,
        prompt: writerPrompt(
          chosen,
          category,
          existingTags,
          recentTopics,
          today,
          morning,
        ),
        schema: WRITER_SCHEMA,
        effort: 'medium',
        maxTokens: 12000,
      });
      usage.push({ ...written.usage, stage: 'write' });

      // 기사 번호: 본문 기사 다음에 아침 속보 기사가 이어진다
      const numbered = [...chosen, ...morning];
      const newsletter = normalize(
        markMorning(
          JSON.parse(written.text) as WrittenNewsletter,
          chosen.length,
          morning.length > 0,
        ),
        (n) => (numbered[n - 1] ? numbered[n - 1].index + 1 : undefined),
      );
      const tokens = usage.reduce((sum, u) => sum + u.input + u.output, 0);
      return {
        newsletter,
        tokens,
        usage,
        selection,
        // 원래 기사 목록의 위치(index)마다 임베딩: 부른 쪽이 남겨 추천 기사에 다시 쓴다
        embeddings: vectors
          ? prepared.map((article, i) => ({
              index: article.index,
              vector: vectors[i],
            }))
          : [],
      };
    } catch (error) {
      // 호출이 끝난 뒤의 실패(응답 읽기 · 고른 소식 없음 등)도 쓴 사용량은 남긴다
      if (error instanceof UsageError) throw error;
      throw new UsageError((error as Error).message, [...usage], {
        cause: error,
      });
    }
  }
}
