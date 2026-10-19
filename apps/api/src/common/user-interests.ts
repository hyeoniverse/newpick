import { BadRequestException } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';

/** 중복을 없애고, 존재하지 않는 카테고리 id가 있으면 400을 던집니다. */
export async function validateCategoryIds(
  prisma: MysqlPrismaService,
  categoryIds: number[],
): Promise<number[]> {
  const ids = [...new Set(categoryIds)];
  if (ids.length === 0) return ids;

  const found = await prisma.newsCategory.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    const valid = new Set(found.map((c) => c.id));
    const invalid = ids.filter((id) => !valid.has(id));
    throw new BadRequestException(
      `존재하지 않는 카테고리입니다: ${invalid.join(', ')}`,
    );
  }
  return ids;
}

/** 사용자의 관심사를 주어진 목록으로 바꾸는 쓰기 작업. $transaction 배열에 넣어 사용합니다. */
export function replaceInterestsOps(
  prisma: MysqlPrismaService,
  userId: number,
  categoryIds: number[],
) {
  return [
    prisma.userInterest.deleteMany({ where: { userId } }),
    prisma.userInterest.createMany({
      data: categoryIds.map((categoryId) => ({ userId, categoryId })),
    }),
  ];
}

/** 사용자의 관심 카테고리 id 목록 (오름차순) */
export async function getInterestIds(
  prisma: MysqlPrismaService,
  userId: number,
): Promise<number[]> {
  const rows = await prisma.userInterest.findMany({
    where: { userId },
    select: { categoryId: true },
    orderBy: { categoryId: 'asc' },
  });
  return rows.map((row) => row.categoryId);
}
