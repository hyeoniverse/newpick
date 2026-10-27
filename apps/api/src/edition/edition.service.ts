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
  ) {}

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
          ...usageLog([response.usage]),
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

  /** 구독자 한 명의 메일. 고른 분야 소식이 그날 하나도 없으면 null */
  /**
   * 구독자 한 명의 메일. userId를 주면(실제 발송) 그 사람의 원클릭 해지를 붙인다 (#18)
   * - 본문 아래 '수신 거부': 로그인 없이 여는 확인 화면 /unsubscribe?token=
   * - 메일 헤더 List-Unsubscribe(+ -Post): 메일 앱의 '구독 취소' 버튼이 사이트를 거쳐 API로 바로 POST (RFC 8058)
   */
  composeMail(edition: Edition, interests: number[], userId?: number) {
    const composed = composeEdition(
      edition.sources,
      edition.editorial,
      interests,
      dayjs.tz(edition.date, KST).toDate(),
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
