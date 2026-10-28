import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AppException } from '../common/errors/app.exception';
import { CreateHighlightDto } from './dto/highlight.dto';

/** 문장의 공백을 하나로 (화면에서 고른 글은 줄바꿈 · 여러 칸이 섞여 온다) */
export const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

const SELECT = {
  id: true,
  newsletterId: true,
  section: true,
  text: true,
  note: true,
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
    return this.prisma.highlight.findMany({
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

  async updateNote(userId: number, id: number, note: string) {
    await this.own(userId, id);
    return this.prisma.highlight.update({
      where: { id },
      data: { note: note.trim() || null },
      select: SELECT,
    });
  }

  async remove(userId: number, id: number) {
    await this.own(userId, id);
    await this.prisma.highlight.delete({ where: { id } });
    return { id };
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
