import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import {
  getInterestIds,
  replaceInterestsOps,
  validateCategoryIds,
} from 'src/common/user-interests';
import { deleteAccount } from 'src/common/delete-account';
import { AppException } from '../common/errors/app.exception';
import { EditionService } from '../edition/edition.service';

@Injectable()
export class MyPageService {
  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly editionService: EditionService,
  ) {}

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
      throw new AppException('USER_NOT_FOUND');
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
   * 내가 실제로 받은 메일 (내 뉴스레터 탭). 발송 기록(email_archives)을 보낸 시각별로 묶어 한 통씩.
   * 메일 본문은 저장하지 않으므로, 그 메일에 엮어 보낸 뉴스레터들로 보여 준다. 최신 메일부터
   */
  async getMails(userId: number, offset = 0, limit = 5) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new AppException('USER_NOT_FOUND');

    const where = { email: user.email };
    const [sends, all] = await Promise.all([
      this.prisma.emailArchive.groupBy({
        by: ['sentAt'],
        where,
        orderBy: { sentAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.emailArchive.groupBy({ by: ['sentAt'], where }),
    ]);
    if (!sends.length) return { items: [], total: all.length };

    const archives = await this.prisma.emailArchive.findMany({
      where: { ...where, sentAt: { in: sends.map((s) => s.sentAt) } },
      orderBy: { newsletter: { categoryId: 'asc' } },
      select: {
        sentAt: true,
        newsletter: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            imageUrl: true,
            content: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 받은편지함처럼 메일 제목도 (발송 때와 같은 방식으로 다시 만든다, AI 호출 없음)
    const subjects = await Promise.all(
      sends.map(({ sentAt }) =>
        this.editionService
          .rebuildMail(
            sentAt,
            archives
              .filter((a) => a.sentAt.getTime() === sentAt.getTime())
              .map((a) => a.newsletter.id),
          )
          .then((mail) => mail?.subject ?? null),
      ),
    );

    return {
      total: all.length,
      items: sends.map(({ sentAt }, i) => ({
        sentAt,
        subject: subjects[i],
        newsletters: archives
          .filter((a) => a.sentAt.getTime() === sentAt.getTime())
          .map(({ newsletter: n }) => ({
            id: n.id,
            title: n.title,
            subtitle: n.subtitle,
            image: n.imageUrl?.split(',').find(Boolean) ?? null,
            summary: n.content ? n.content.substring(0, 100) + '...' : null,
            createdAt: n.createdAt,
            category: n.category,
          })),
      })),
    };
  }

  /**
   * 받은 메일 한 통을 받은 그대로 (보낸 시각으로 찾는다). 내 발송 기록에 없으면 404
   */
  async getMail(userId: number, sentAt: Date) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new AppException('USER_NOT_FOUND');
    const archives = await this.prisma.emailArchive.findMany({
      where: { email: user.email, sentAt },
      select: { newsletterId: true },
    });
    const mail =
      archives.length &&
      (await this.editionService.rebuildMail(
        sentAt,
        archives.map((a) => a.newsletterId),
      ));
    if (!mail)
      throw new AppException('NOT_FOUND', '받은 메일을 찾지 못했어요.');
    return { sentAt, subject: mail.subject, html: mail.html };
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
