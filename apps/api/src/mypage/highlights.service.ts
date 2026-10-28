import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AppException } from '../common/errors/app.exception';
import { CreateHighlightDto } from './dto/highlight.dto';

/** 문장의 공백을 하나로 (화면에서 고른 글은 줄바꿈 · 여러 칸이 섞여 온다) */
export const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * 본문 HTML에서 소식마다 제목 (화면 수집기가 셀 때와 같은 순서: .story 차례). 브리핑 · 구역 모름은 null
 * 마이페이지에서 '소식 2' 대신 그 소식의 제목을 보이려고. 저장하지 않고 읽을 때 꺼내, 본문을 고쳐도 지금 제목이 나온다
 */
export function sectionTitles(html: string | null) {
  if (!html) return [];
  const { document } = new JSDOM(html).window;
  return Array.from(document.querySelectorAll('.story')).map(
    (story) =>
      story.querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim() ||
      null,
  );
}

export function sectionTitle(
  titles: (string | null)[],
  section: string | null,
) {
  const story = section?.match(/^story-(\d+)$/);
  return story ? (titles[Number(story[1]) - 1] ?? null) : null;
}

const SELECT = {
  id: true,
  newsletterId: true,
  section: true,
  text: true,
  note: true,
  starred: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * 스크랩 · 메모 (#123 1단계). 본인 것만 보고 바꾼다.
 * 같은 문장을 다시 스크랩하면 새로 만들지 않고 (메모를 주면 메모만) 고친다
 */
@Injectable()
export class HighlightsService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 내 스크랩. 뉴스레터를 주면 그 뉴스레터 것만 (상세 화면 형광펜용), 아니면 전체 (마이페이지) */
  async list(userId: number, newsletterId?: number) {
    const highlights = await this.prisma.highlight.findMany({
      where: { userId, ...(newsletterId && { newsletterId }) },
      orderBy: { createdAt: 'desc' },
      select: {
        ...SELECT,
        newsletter: {
          select: {
            title: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
    // 소식 제목: 뉴스레터마다 본문을 한 번만 읽는다
    const ids = [...new Set(highlights.map((h) => h.newsletterId))];
    const bodies = ids.length
      ? await this.prisma.newsletter.findMany({
          where: { id: { in: ids } },
          select: { id: true, contentAsHTML: true },
        })
      : [];
    const titles = new Map(
      bodies.map((b) => [b.id, sectionTitles(b.contentAsHTML)]),
    );
    return highlights.map((h) => ({
      ...h,
      sectionTitle: sectionTitle(titles.get(h.newsletterId) ?? [], h.section),
    }));
  }

  async create(userId: number, dto: CreateHighlightDto) {
    const text = normalizeText(dto.text);
    if (text.length < 2) {
      throw new AppException('BAD_REQUEST', '두 글자 이상 골라 주세요.');
    }
    const exists = await this.prisma.newsletter.findUnique({
      where: { id: dto.newsletterId },
      select: { id: true },
    });
    if (!exists) throw new AppException('NEWSLETTER_NOT_FOUND');

    const note = dto.note?.trim() || undefined;
    return this.prisma.highlight.upsert({
      where: {
        userId_newsletterId_text: {
          userId,
          newsletterId: dto.newsletterId,
          text,
        },
      },
      create: {
        userId,
        newsletterId: dto.newsletterId,
        section: dto.section ?? null,
        text,
        note: note ?? null,
      },
      update: note ? { note } : {},
      select: SELECT,
    });
  }

  /** 메모 · 별표 중 준 것만 바꾼다 (빈 메모는 지우기) */
  async update(
    userId: number,
    id: number,
    changes: { note?: string; starred?: boolean },
  ) {
    await this.own(userId, id);
    return this.prisma.highlight.update({
      where: { id },
      data: {
        ...(changes.note !== undefined && {
          note: changes.note.trim() || null,
        }),
        ...(changes.starred !== undefined && { starred: changes.starred }),
      },
      select: SELECT,
    });
  }

  async remove(userId: number, id: number) {
    await this.own(userId, id);
    await this.prisma.highlight.delete({ where: { id } });
    return { id };
  }

  /** 여러 개 지우기: 내 것만 지우고(남의 번호는 조용히 건너뜀) 지운 수를 돌려준다 */
  async removeMany(userId: number, ids: number[]) {
    const { count } = await this.prisma.highlight.deleteMany({
      where: { userId, id: { in: [...new Set(ids)] } },
    });
    return { count };
  }

  /** 남의 스크랩은 없는 것처럼 (있는지도 알려 주지 않게 404) */
  private async own(userId: number, id: number) {
    const found = await this.prisma.highlight.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!found) throw new AppException('HIGHLIGHT_NOT_FOUND');
  }
}
