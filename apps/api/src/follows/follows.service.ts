import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AiService, AiUnavailable } from '../ai/ai.service';
import { AppException } from '../common/errors/app.exception';
import { kstDayRange, kstDaysAgo } from '../common/kst';
import { parseNewsletterHtml, ParsedStory, storyText } from '../edition/parse';
import {
  acceptedFrom,
  candidatesFor,
  FOLLOW_LIMITS,
  JUDGE_SCHEMA,
  JUDGE_SYSTEM,
  judgePrompt,
  NewStory,
} from './detect';

/** 판정 · 임베딩에 쓰는 소식 글 (제목 · 리드 · 본문 앞부분) */
const textOf = (story: ParsedStory) =>
  [story.heading, story.lead, storyText(story, 600)].filter(Boolean).join('\n');

const asVector = (value: unknown) =>
  Array.isArray(value) && value.every((v) => typeof v === 'number')
    ? (value as number[])
    : null;

/**
 * 후속 지켜보기: 뉴스레터 속 소식을 지켜보다가, 이어지는 새 소식이 나오면 쌓아 두고 알린다.
 * 판정은 하루 한 번 (새 뉴스레터를 다 쓴 뒤), 비용은 지켜보는 소식 수만큼의 짧은 판정뿐 (Workers AI 무료 할당)
 */
@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly ai: AiService,
  ) {}

  /** 지켜보기 시작: 그 소식의 제목 · 글을 그때 그대로 남긴다 */
  async follow(userId: number, newsletterId: number, storyIndex: number) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id: newsletterId },
      select: { contentAsHTML: true },
    });
    if (!newsletter) throw new AppException('NEWSLETTER_NOT_FOUND');
    const story = parseNewsletterHtml(newsletter.contentAsHTML).stories[
      storyIndex - 1
    ];
    if (!story) throw new AppException('NOT_FOUND', '그 소식이 없습니다.');
    const follow = await this.prisma.storyFollow.upsert({
      where: {
        userId_newsletterId_storyIndex: { userId, newsletterId, storyIndex },
      },
      update: {},
      create: {
        userId,
        newsletterId,
        storyIndex,
        heading: story.heading.slice(0, 200),
        text: textOf(story),
      },
      select: { id: true, storyIndex: true },
    });
    return follow;
  }

  async unfollow(userId: number, followId: number) {
    const { count } = await this.prisma.storyFollow.deleteMany({
      where: { id: followId, userId },
    });
    if (!count) throw new AppException('NOT_FOUND');
    return { removed: count };
  }

  /** 뉴스레터 상세: 이 뉴스레터에서 내가 지켜보는 소식들 (단추 상태) */
  forNewsletter(userId: number, newsletterId: number) {
    return this.prisma.storyFollow.findMany({
      where: { userId, newsletterId },
      select: {
        id: true,
        storyIndex: true,
        _count: { select: { updates: true } },
      },
    });
  }

  /** 마이페이지: 지켜보는 소식마다 이어진 소식 (새 소식이 있는 것 먼저, 그다음 최근에 지켜본 순) */
  async list(userId: number) {
    const follows = await this.prisma.storyFollow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        heading: true,
        storyIndex: true,
        createdAt: true,
        newsletter: {
          select: {
            id: true,
            createdAt: true,
            category: { select: { name: true } },
          },
        },
        updates: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            heading: true,
            reason: true,
            storyIndex: true,
            createdAt: true,
            seenAt: true,
            newsletter: {
              select: {
                id: true,
                createdAt: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    const unseen = (f: (typeof follows)[number]) =>
      f.updates.some((u) => !u.seenAt);
    return follows.sort((a, b) => Number(unseen(b)) - Number(unseen(a)));
  }

  /** 아직 안 본 후속 소식 수 (머리글 표시) */
  unseenCount(userId: number) {
    return this.prisma.followUpdate.count({
      where: { seenAt: null, follow: { userId } },
    });
  }

  /** 마이페이지에서 봤으면 모두 본 것으로 */
  async markSeen(userId: number) {
    const { count } = await this.prisma.followUpdate.updateMany({
      where: { seenAt: null, follow: { userId } },
      data: { seenAt: new Date() },
    });
    return { seen: count };
  }

  /**
   * 하루 한 번: 오늘 나온 뉴스레터의 소식이 누군가 지켜보는 소식의 후속인지 판정해 쌓는다.
   * 지켜보는 사람이 없으면 아무것도 부르지 않는다
   */
  async detect(date = kstDaysAgo(0)) {
    const { start, end } = kstDayRange(date, date);
    const since = new Date(
      Date.now() - FOLLOW_LIMITS.maxAgeDays * 24 * 60 * 60 * 1000,
    );
    const follows = await this.prisma.storyFollow.findMany({
      where: {
        createdAt: { gte: since },
        newsletter: { createdAt: { lt: start } },
      },
      select: {
        id: true,
        newsletterId: true,
        heading: true,
        text: true,
        embedding: true,
      },
    });
    if (!follows.length) return { follows: 0, checked: 0, updates: 0 };

    const newsletters = await this.prisma.newsletter.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: {
        id: true,
        contentAsHTML: true,
        category: { select: { name: true } },
      },
    });
    const fresh = newsletters.flatMap((n) =>
      parseNewsletterHtml(n.contentAsHTML).stories.map((story, i) => ({
        newsletterId: n.id,
        storyIndex: i + 1,
        category: n.category.name,
        heading: story.heading,
        text: textOf(story),
      })),
    );
    if (!fresh.length)
      return { follows: follows.length, checked: 0, updates: 0 };

    let stories: NewStory[];
    try {
      const vectors = await this.ai.embed(fresh.map((s) => s.text));
      stories = fresh.map((s, i) => ({ ...s, vector: vectors[i] }));
      // 지켜보는 소식의 임베딩은 처음 한 번만 계산해 둔다
      const missing = follows.filter((f) => !asVector(f.embedding));
      if (missing.length) {
        const made = await this.ai.embed(missing.map((f) => f.text));
        await Promise.all(
          missing.map((f, i) => {
            f.embedding = made[i];
            return this.prisma.storyFollow.update({
              where: { id: f.id },
              data: { embedding: made[i] },
            });
          }),
        );
      }
    } catch (error) {
      this.logger.warn(
        `후속 지켜보기: 임베딩 실패, 오늘은 건너뜀 (${(error as Error).message})`,
      );
      return { follows: follows.length, checked: 0, updates: 0 };
    }

    let checked = 0;
    let updates = 0;
    for (const f of follows) {
      const target = { ...f, vector: asVector(f.embedding)! };
      const candidates = candidatesFor(target, stories);
      if (!candidates.length) continue;
      checked++;
      let accepted: { index: number; reason: string }[];
      try {
        const { text } = await this.ai.generate({
          stage: 'follow-judge',
          prefer: 'open',
          fallback: false,
          system: JUDGE_SYSTEM,
          prompt: judgePrompt(f, candidates),
          schema: JUDGE_SCHEMA,
          maxTokens: 600,
        });
        accepted = acceptedFrom(JSON.parse(text), candidates.length);
      } catch (error) {
        if (
          !(error instanceof AiUnavailable) &&
          !(error instanceof SyntaxError)
        )
          this.logger.warn(
            `후속 판정 실패 #${f.id}: ${(error as Error).message}`,
          );
        // 판정을 못 하면 아주 비슷한 것만
        accepted = candidates
          .map((c, index) => ({ index, reason: '', score: c.score }))
          .filter((c) => c.score >= FOLLOW_LIMITS.autoAccept);
      }
      if (!accepted.length) continue;
      const { count } = await this.prisma.followUpdate.createMany({
        skipDuplicates: true,
        data: accepted.map(({ index, reason }) => {
          const { story } = candidates[index];
          return {
            followId: f.id,
            newsletterId: story.newsletterId,
            storyIndex: story.storyIndex,
            heading: story.heading.slice(0, 200),
            reason,
          };
        }),
      });
      updates += count;
    }
    this.logger.log(
      `후속 지켜보기: 지켜보는 소식 ${follows.length}개 중 후보 ${checked}개 판정, 새 후속 ${updates}건`,
    );
    return { follows: follows.length, checked, updates };
  }
}
