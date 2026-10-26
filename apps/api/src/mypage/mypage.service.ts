import { Injectable, NotFoundException } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import {
  getInterestIds,
  replaceInterestsOps,
  validateCategoryIds,
} from 'src/common/user-interests';
import { deleteAccount } from 'src/common/delete-account';

@Injectable()
export class MyPageService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 회원 탈퇴: 회원 정보와 관심 분야·구독·북마크·발송 기록을 함께 지운다 (#65) */
  async deleteAccount(userId: number) {
    return deleteAccount(this.prisma, userId);
  }

  /**
   * 사용자 프로필 조회
   * @param userId 사용자 ID
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        profileImg: true,
        timezone: true,
        // 관리자 화면(/admin) 접근 여부를 웹이 판단한다. 실제 권한 확인은 API의 @AdminOnly
        role: true,
        interests: {
          select: { categoryId: true },
          orderBy: { categoryId: 'asc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // 응답 형태는 이전과 같이 interests: number[]
    return {
      ...user,
      interests: user.interests.map((interest) => interest.categoryId),
    };
  }

  /**
   * 북마크한 뉴스레터 조회
   * @param userId 사용자 ID
   */
  async getBookmarks(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        newsletter: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            content: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!bookmarks.length) {
      throw new NotFoundException('No bookmarks found for this user.');
    }

    return bookmarks.map(({ newsletter }) => ({
      id: newsletter.id,
      newsTitle: newsletter.title,
      newsImg: newsletter.imageUrl || null,
      newsCreatedAt: newsletter.createdAt,
      newsSummary: newsletter.content
        ? newsletter.content.substring(0, 100) + '...'
        : null,
      category: newsletter.category,
    }));
  }

  /**
   * 관심사 조회
   * @param userId 사용자 ID
   */
  async getInterests(userId: number) {
    return getInterestIds(this.prisma, userId);
  }

  /**
   * 관심사 수정 (덮어쓰기)
   * @param userId 사용자 ID
   * @param categoryIds 새로운 관심사 목록
   */
  async updateInterests(userId: number, categoryIds: number[]) {
    const ids = await validateCategoryIds(this.prisma, categoryIds);
    await this.prisma.$transaction(
      replaceInterestsOps(this.prisma, userId, ids),
    );
    return { interests: await getInterestIds(this.prisma, userId) };
  }
}
