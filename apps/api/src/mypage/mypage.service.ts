import type { Profile } from '@newpick/shared';
import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import {
  getInterestIds,
  replaceInterestsOps,
  validateCategoryIds,
} from 'src/common/user-interests';
import { deleteAccount } from 'src/common/delete-account';
import { AppException } from 'src/common/errors/app.exception';

/** 마이페이지 계정: 프로필 · 맞춤 메일 설정 · 관심사 · 탈퇴. 북마크는 BookmarksService, 받은 메일은 MyMailsService */
@Injectable()
export class MyPageService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 회원 탈퇴: 회원 정보와 관심 분야·구독·북마크·발송 기록을 함께 지운다 (#65) */
  async deleteAccount(userId: number) {
    return deleteAccount(this.prisma, userId);
  }

  /** 맞춤 메일 켜짐 여부 (#123 16) */
  async getPersonalMail(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { personalMail: true },
    });
    return { enabled: user?.personalMail ?? true };
  }

  async setPersonalMail(userId: number, enabled: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { personalMail: enabled },
    });
    return { enabled };
  }

  /**
   * 사용자 프로필 조회
   * @param userId 사용자 ID
   */
  async getProfile(userId: number): Promise<Profile> {
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
      throw new AppException('USER_NOT_FOUND');
    }

    // 응답 형태는 이전과 같이 interests: number[]
    return {
      ...user,
      role: user.role === 'admin' ? 'admin' : 'user',
      interests: user.interests.map((interest) => interest.categoryId),
    };
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
