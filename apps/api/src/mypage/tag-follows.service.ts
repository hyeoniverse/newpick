import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { TagsService } from 'src/tags/tags.service';
import { AppException } from '../common/errors/app.exception';

/** 한 사람이 팔로우할 수 있는 태그 수 */
export const TAG_FOLLOW_LIMIT = 20;

/**
 * 태그 팔로우 (#123 5단계, "키워드 등록"): 뉴스레터 태그를 직접 골라 관심을 밝힌다.
 * 새 어휘를 만들지 않고 뉴스레터 태그 표기에 맞춘다 (합치기 규칙 · 기존 표기, #20) — '엔비디아' · 'NVIDIA'가 갈라지지 않게
 */
@Injectable()
export class TagFollowsService {
  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly tags: TagsService,
  ) {}

  async list(userId: number) {
    const rows = await this.prisma.tagFollow.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { tag: true, createdAt: true },
    });
    return rows;
  }

  /** 팔로우 (이미 하고 있으면 그대로). 돌려주는 태그는 뉴스레터 표기에 맞춘 것 */
  async follow(userId: number, raw: string) {
    const [tag] = await this.tags.canonicalize([raw.trim()]);
    if (!tag) throw new AppException('VALIDATION_FAILED');
    const exists = await this.prisma.tagFollow.findUnique({
      where: { userId_tag: { userId, tag } },
    });
    if (!exists) {
      const count = await this.prisma.tagFollow.count({ where: { userId } });
      if (count >= TAG_FOLLOW_LIMIT) throw new AppException('TAG_FOLLOW_LIMIT');
      await this.prisma.tagFollow.create({ data: { userId, tag } });
    }
    return { tag };
  }

  async unfollow(userId: number, tag: string) {
    await this.prisma.tagFollow.deleteMany({ where: { userId, tag } });
    return { tag };
  }
}
