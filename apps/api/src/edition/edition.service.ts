import { usageLog } from 'src/ai-summary/pricing';
import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { MysqlPrismaService } from '../../prisma/mysql.service';
import { ClaudeService } from '../ai-summary/claude.service';
import { KST, kstDayRange, kstDaysAgo } from '../common/kst';
import { parseNewsletterHtml } from './parse';
import {
  EDITOR_SCHEMA,
  EDITOR_SYSTEM,
  Editorial,
  editorPrompt,
  normalizeEditorial,
  storyRef,
} from './editor';
import { composeEdition, EditionNewsletter } from './compose';
import type { MailPlan, TasteProfile } from './personalize';
import {
  NOTE_SCHEMA,
  NOTE_SYSTEM,
  normalizeNote,
  notePrompt,
  PersonalNote,
} from './personalNote';
import { AiService } from '../ai/ai.service';
import { createUnsubscribeToken } from 'src/subscriber/unsubscribe-token';
import { renderEditionMail } from './mail';

export type Edition = {
  /** KST 'YYYY-MM-DD' */
  date: string;
  sources: EditionNewsletter[];
  editorial: Editorial | null;
};

@Injectable()
export class EditionService {
  private readonly logger = new Logger(EditionService.name);

  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly claude: ClaudeService,
    private readonly ai: AiService,
  ) {}

  /**
   * 사람마다 쓰는 글 (#123 3단계): 이 사람에게 갈 메일(맞춤 계획까지 반영)을 보고 제목 · 맞춤 브리핑 · '나에게 왜'를 쓴다.
   * 오픈 모델(Workers AI 무료 할당)만 쓰고 Claude로 넘기지 않는다 — 안 되면 null(맞춤 순서만 있는 메일)
   */
  async writeNote(
    edition: Edition,
    interests: number[],
    plan: MailPlan,
    profile: TasteProfile,
  ): Promise<PersonalNote | null> {
    const composed = composeEdition(
      edition.sources,
      edition.editorial,
      interests,
      dayjs.tz(edition.date, KST).toDate(),
      plan,
    );
    if (!composed?.top.length) return null;
    try {
      const { text } = await this.ai.generate({
        stage: 'personal-note',
        prefer: 'open',
        fallback: false,
        system: NOTE_SYSTEM,
        prompt: notePrompt(composed, profile),
        schema: NOTE_SCHEMA,
        maxTokens: 1500,
      });
      return normalizeNote(JSON.parse(text), composed);
    } catch (error) {
      this.logger.warn(
        `맞춤 글 쓰기 실패, 맞춤 순서만으로 보냄: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * 그 날짜(KST)의 편집본. 처음이면 그날 뉴스레터로 편집해 저장하고, 있으면 그대로 쓴다 (다시 보내도 호출 없음).
   * 그날 뉴스레터가 없으면 null. 편집 호출이 실패해도 편집 없이 돌려준다 (메일은 나간다)
   */
  async ensureEdition(date = kstDaysAgo(0)): Promise<Edition | null> {
    const saved = await this.prisma.dailyEdition.findUnique({
      where: { date },
    });
    if (saved) {
      return {
        date,
        sources: await this.loadSources({
          ids: saved.newsletterIds as number[],
        }),
        editorial: saved.editorial as Editorial | null,
      };
    }

    const sources = await this.loadSources({ date });
    if (!sources.length) return null;

    try {
      const { editorial, tokens } = await this.edit(sources);
      await this.prisma.dailyEdition.upsert({
        where: { date },
        create: {
          date,
          newsletterIds: sources.map((s) => s.newsletterId),
          editorial,
          token: tokens,
        },
        update: {},
      });
      return { date, sources, editorial };
    } catch (error) {
      // 저장하지 않아 다음 발송(수동 포함) 때 다시 편집한다
      this.logger.error(
        `편집 실패, 편집 없이 보냅니다 (${date}): ${error.message}`,
      );
      return { date, sources, editorial: null };
    }
  }

  /** 전 분야 소식 → 중요도·같은 사건·흐름. 하루 한 번 */
  async edit(sources: EditionNewsletter[]) {
    const categoryOf = new Map(
      sources.flatMap((s) =>
        s.stories.map((_, i) => [storyRef(s.newsletterId, i), s.categoryId]),
      ),
    );
    const startTime = Date.now();
    const response = await this.claude.generate({
      system: EDITOR_SYSTEM,
      prompt: editorPrompt(sources),
      schema: EDITOR_SCHEMA,
      effort: 'low',
      maxTokens: 6000,
    });
    const editorial = normalizeEditorial(JSON.parse(response.text), (ref) =>
      categoryOf.get(ref),
    );
    this.logger.log(
      `편집 완료: 소식 ${categoryOf.size}개, 흐름 ${editorial.threads.length}개, 토큰 ${response.tokens}`,
    );
    // 하루 한 번 편집 호출도 AI 기록에 남겨 비용이 빠지지 않게 (#21). 기록 실패는 편집을 막지 않는다
    await this.prisma.aiProcessLog
      .create({
        data: {
          newsId: sources.map((s) => s.newsletterId).join(','),
          processType: 'edition',
          result: `소식 ${categoryOf.size}개, 흐름 ${editorial.threads.length}개`,
          duration: (Date.now() - startTime) / 1000,
          status: 'success',
          token: response.tokens,
          error: null,
          ...usageLog([response.usage], 'edition'),
        },
      })
      .catch((error) => this.logger.warn(`편집 기록 실패: ${error.message}`));
    return { editorial, tokens: response.tokens };
  }

  /**
   * 미리보기(체험하기)용: 가장 최근에 나온 날의 편집본. 편집을 새로 하지 않는다 (공개 API라 비용이 나가면 안 됨).
   * 그날 편집본이 아직 없으면 편집 없이 엮는다
   */
  async latestEdition(): Promise<Edition | null> {
    const last = await this.prisma.newsletter.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (!last) return null;
    const date = dayjs(last.createdAt).tz(KST).format('YYYY-MM-DD');
    const saved = await this.prisma.dailyEdition.findUnique({
      where: { date },
    });
    const sources = saved
      ? await this.loadSources({ ids: saved.newsletterIds as number[] })
      : await this.loadSources({ date });
    return {
      date,
      sources,
      editorial: (saved?.editorial as Editorial | null) ?? null,
    };
  }

  /**
   * 이미 보낸 메일 다시 만들기 (마이페이지 '내 뉴스레터'). 보낸 날의 편집본 + 그 메일에 엮은 뉴스레터로
   * 발송 때와 같은 HTML을 만든다 (AI 호출 없음). 수신 거부 링크는 붙이지 않는다
   */
  async rebuildMail(
    sentAt: Date,
    newsletterIds: number[],
    plan?: MailPlan | null,
  ) {
    const date = dayjs(sentAt).tz(KST).format('YYYY-MM-DD');
    const [saved, sources] = await Promise.all([
      this.prisma.dailyEdition.findUnique({ where: { date } }),
      this.loadSources({ ids: withExtras(newsletterIds, plan) }),
    ]);
    return this.composeMail(
      {
        date,
        sources,
        editorial: (saved?.editorial as Editorial | null) ?? null,
      },
      interestsOf(sources, newsletterIds),
      undefined,
      plan,
    );
  }

  /**
   * 이미 보낸 메일의 짜임새만 (마이페이지 목록용): 오늘 한눈에 · 분야를 넘는 흐름 · 분야별 소식 제목 · 관전 포인트.
   * rebuildMail과 같은 재료(보낸 날의 편집본 + 엮은 뉴스레터)로 엮되 HTML은 만들지 않는다 (AI 호출 없음)
   */
  async rebuildDigest(
    sentAt: Date,
    newsletterIds: number[],
    plan?: MailPlan | null,
  ) {
    const date = dayjs(sentAt).tz(KST).format('YYYY-MM-DD');
    const [saved, sources] = await Promise.all([
      this.prisma.dailyEdition.findUnique({ where: { date } }),
      this.loadSources({ ids: withExtras(newsletterIds, plan) }),
    ]);
    return composeEdition(
      sources,
      (saved?.editorial as Editorial | null) ?? null,
      interestsOf(sources, newsletterIds),
      dayjs.tz(date, KST).toDate(),
      plan,
    );
  }

  /**
   * 구독자 한 명의 메일. userId를 주면(실제 발송) 그 사람의 원클릭 해지를 붙인다 (#18)
   * - 본문 아래 '수신 거부': 로그인 없이 여는 확인 화면 /unsubscribe?token=
   * - 메일 헤더 List-Unsubscribe(+ -Post): 메일 앱의 '구독 취소' 버튼이 사이트를 거쳐 API로 바로 POST (RFC 8058)
   */
  composeMail(
    edition: Edition,
    interests: number[],
    userId?: number,
    /** 맞춤 계획 (#123 3단계). 없으면 지금처럼 고른 분야로만 */
    plan?: MailPlan | null,
  ) {
    const composed = composeEdition(
      edition.sources,
      edition.editorial,
      interests,
      dayjs.tz(edition.date, KST).toDate(),
      plan,
    );
    if (!composed) return null;

    const base = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '');
    const token =
      userId !== undefined ? createUnsubscribeToken(userId) : undefined;
    return {
      subject: composed.subject,
      html: renderEditionMail(
        composed,
        base,
        process.env.MAIL_USER,
        token && `${base}/unsubscribe?token=${token}`,
      ),
      newsletterIds: composed.sections.map((s) => s.newsletterId),
      // 실제로 쓴 맞춤만 남긴다 (더한 소식 · 추천 기사 · 앞당긴 소식이 모두 없으면 기록하지 않음)
      plan:
        plan &&
        (composed.extras.length ||
          composed.picks.length ||
          Object.keys(plan.boosts).length)
          ? plan
          : null,
      ...(token && {
        headers: {
          'List-Unsubscribe': `<${base}/api/subscribers/unsubscribe?token=${token}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    };
  }

  /** 그날(또는 지정한 id들) 분야마다 가장 최근 뉴스레터 한 편 */
  private async loadSources(
    by: { date: string } | { ids: number[] },
  ): Promise<EditionNewsletter[]> {
    const where =
      'ids' in by
        ? { id: { in: by.ids } }
        : (() => {
            const { start, end } = kstDayRange(by.date, by.date);
            return { createdAt: { gte: start, lte: end } };
          })();
    const newsletters = await this.prisma.newsletter.findMany({
      where,
      orderBy: [{ categoryId: 'asc' }, { createdAt: 'desc' }],
      include: { category: { select: { name: true } } },
    });

    const seen = new Set<number>();
    return newsletters
      .filter((n) => !seen.has(n.categoryId) && seen.add(n.categoryId))
      .map((n) => {
        const parsed = parseNewsletterHtml(n.contentAsHTML);
        return {
          newsletterId: n.id,
          categoryId: n.categoryId,
          category: n.category.name,
          title: n.title,
          subtitle: n.subtitle,
          summary: n.content,
          stories: parsed.stories,
          watch: parsed.watch,
        };
      });
  }
}

/** 다시 만들 때 불러올 뉴스레터: 발송 기록(고른 분야) + 맞춤으로 더한 다른 분야 */
const withExtras = (newsletterIds: number[], plan?: MailPlan | null) => [
  ...new Set([
    ...newsletterIds,
    ...(plan?.extras.map((e) => e.newsletterId) ?? []),
  ]),
];

/** 고른 분야: 발송 기록에 있는 뉴스레터의 분야만 (맞춤으로 더한 분야는 빼고) */
const interestsOf = (sources: EditionNewsletter[], newsletterIds: number[]) =>
  sources
    .filter((s) => newsletterIds.includes(s.newsletterId))
    .map((s) => s.categoryId);
