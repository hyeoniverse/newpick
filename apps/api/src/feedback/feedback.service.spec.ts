import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { FeedbackService } from './feedback.service';
import { BookmarkDto } from './dto/bookmark.dto';

function fakePrisma(newsletterExists = true) {
  return {
    newsletter: {
      findUnique: jest
        .fn()
        .mockResolvedValue(newsletterExists ? { id: 7 } : null),
      findFirst: jest.fn(),
    },
    bookmark: {
      create: jest
        .fn()
        .mockResolvedValue({ id: 1, userId: 1, newsletterId: 7 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

describe('FeedbackService 북마크', () => {
  it('뉴스레터 id로 직접 찾는다 (usedNews 문자열 검색으로 엉뚱한 뉴스레터에 연결되던 버그)', async () => {
    const prisma = fakePrisma();
    await new FeedbackService(prisma as never).addBookmark(1, 7);
    expect(prisma.newsletter.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true },
    });
    expect(prisma.newsletter.findFirst).not.toHaveBeenCalled();
    expect(prisma.bookmark.create).toHaveBeenCalledWith({
      data: { userId: 1, newsletterId: 7 },
    });
  });

  it('없는 뉴스레터면 404', async () => {
    const prisma = fakePrisma(false);
    await expect(
      new FeedbackService(prisma as never).addBookmark(1, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.bookmark.create).not.toHaveBeenCalled();
  });

  it('이미 북마크했으면 유니크 제약 오류를 409로 바꾼다', async () => {
    const prisma = fakePrisma();
    prisma.bookmark.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      new FeedbackService(prisma as never).addBookmark(1, 7),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('없는 북마크를 지우면 404', async () => {
    const prisma = fakePrisma();
    prisma.bookmark.deleteMany.mockResolvedValue({ count: 0 });
    await expect(
      new FeedbackService(prisma as never).removeBookmark(1, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('BookmarkDto', () => {
  it('newsletterId를 쓰고, 없으면 newsId를 쓴다', () => {
    expect(
      plainToInstance(BookmarkDto, { newsId: 3, newsletterId: 7 }).targetId,
    ).toBe(7);
    expect(plainToInstance(BookmarkDto, { newsId: 3 }).targetId).toBe(3);
  });
});
