import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from '../../prisma/mysql.service';
import { Newsletter, Prisma } from '@prisma/client';

@Injectable()
export class CreateNewsletterService {
  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly logger: Logger,
  ) {}

  async createNewsletter(
    title: string,
    subtitle: string | null,
    summary: string,
    usedNews: string,
    categoryId: number,
    contentAsHTML: string,
    imgUrl: string,
    keywords: string[] = [],
    /** 발행 시각. 지난 날짜를 다시 만들 때 그날로 (기본 지금) */
    createdAt: Date = new Date(),
    /**
     * 이 뉴스레터를 새로 쓴 내용으로 바꾼다 (관리자 '다시 쓰기'). id · 발행일 · 분야 · 조회수 · 북마크는 그대로.
     * 스크랩에 꺼내 둔 소식 제목 · 사진 · 태그는 비워, 다음에 목록을 볼 때 새 본문에서 다시 꺼낸다 (관리자 고치기와 같게)
     */
    replaceId?: number,
  ): Promise<Newsletter> {
    if (replaceId) {
      const replaced = await this.prisma.newsletter.update({
        where: { id: replaceId },
        data: {
          title,
          subtitle,
          content: summary,
          contentAsHTML,
          usedNews,
          imageUrl: imgUrl,
          keywords,
        },
      });
      await this.prisma.highlight.updateMany({
        where: { newsletterId: replaceId },
        data: {
          sectionTitle: null,
          sectionImage: null,
          sectionTags: Prisma.DbNull,
        },
      });
      this.logger.debug(`뉴스레터 다시 씀: ${replaceId}`);
      return replaced;
    }
    const newsletter = await this.prisma.newsletter.create({
      data: {
        title: title,
        subtitle,
        content: summary,
        contentAsHTML,
        categoryId: categoryId,
        createdAt,
        usedNews,
        viewcount: 0,
        imageUrl: imgUrl,
        keywords,
      },
    });

    this.logger.debug(`뉴스레터 생성 완료: ${newsletter.id}`);

    return newsletter;
  }
}
