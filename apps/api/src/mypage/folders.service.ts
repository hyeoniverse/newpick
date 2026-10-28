import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AppException } from '../common/errors/app.exception';

/** 한 사람이 만들 수 있는 폴더 수 */
export const MAX_FOLDERS = 20;

/** 내 폴더인지 (남의 폴더는 없는 것처럼 404). 스크랩 · 북마크 · 받은 메일을 옮길 때 같이 쓴다 */
export async function assertOwnFolder(
  prisma: MysqlPrismaService,
  userId: number,
  id: number,
) {
  const found = await prisma.folder.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!found) throw new AppException('NOT_FOUND', '폴더를 찾을 수 없어요.');
}

/**
 * 폴더 (#123): 스크랩 · 북마크 · 받은 메일이 같이 쓰는 주제 폴더. 30자, 20개까지, 이름이 겹치지 않게.
 * 지우면 안의 것은 지우지 않고 '폴더 없음'으로 (FK SetNull)
 */
@Injectable()
export class FoldersService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 내 폴더 (만든 순서), 폴더마다 스크랩 · 북마크 · 받은 메일 수 */
  async list(userId: number) {
    const folders = await this.prisma.folder.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        _count: {
          select: { highlights: true, bookmarks: true, mailMarks: true },
        },
      },
    });
    return folders.map(({ _count, ...f }) => ({
      ...f,
      counts: {
        highlights: _count.highlights,
        bookmarks: _count.bookmarks,
        mails: _count.mailMarks,
      },
    }));
  }

  async create(userId: number, name: string) {
    const count = await this.prisma.folder.count({ where: { userId } });
    if (count >= MAX_FOLDERS) {
      throw new AppException(
        'BAD_REQUEST',
        `폴더는 ${MAX_FOLDERS}개까지 만들 수 있어요.`,
      );
    }
    await this.uniqueName(userId, name);
    return this.prisma.folder.create({
      data: { userId, name },
      select: { id: true, name: true },
    });
  }

  async rename(userId: number, id: number, name: string) {
    await assertOwnFolder(this.prisma, userId, id);
    await this.uniqueName(userId, name, id);
    return this.prisma.folder.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
  }

  async remove(userId: number, id: number) {
    await assertOwnFolder(this.prisma, userId, id);
    await this.prisma.folder.delete({ where: { id } });
    return { id };
  }

  private async uniqueName(userId: number, name: string, exceptId?: number) {
    const same = await this.prisma.folder.findFirst({
      where: { userId, name, ...(exceptId && { NOT: { id: exceptId } }) },
      select: { id: true },
    });
    if (same) throw new AppException('CONFLICT', '같은 이름의 폴더가 있어요.');
  }
}
