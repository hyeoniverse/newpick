import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MysqlPrismaService } from 'prisma/mysql.service';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 뉴스레터 북마크. 같은 뉴스레터는 (userId, newsletterId) 유니크 제약으로 한 번만 저장됩니다. */
  async addBookmark(userId: number, newsletterId: number) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id: newsletterId },
      select: { id: true },
    });
    if (!newsletter) {
      throw new NotFoundException('Newsletter not found.');
    }

    try {
      return await this.prisma.bookmark.create({
        data: { userId, newsletterId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This item is already bookmarked.');
      }
      throw error;
    }
  }

  async removeBookmark(userId: number, newsletterId: number) {
    const { count } = await this.prisma.bookmark.deleteMany({
      where: { userId, newsletterId },
    });
    if (count === 0) {
      throw new NotFoundException('Bookmark not found.');
    }
    return { success: true };
  }
}
