import {} from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AppException } from './errors/app.exception';

/**
 * 회원과 그 회원의 개인정보를 한 번에 지운다 (#65, 개인정보 처리방침 "탈퇴하면 함께 파기").
 * - 관심 분야·구독·북마크·로그인 토큰: users를 지우면 함께 지워진다 (onDelete: Cascade)
 * - 메일 발송 기록(email_archives): 회원과 연결 없이 이메일 문자열로 저장돼 따로 지운다
 * 둘 중 하나만 지워지지 않게 한 트랜잭션으로 묶는다
 */
export async function deleteAccount(
  prisma: MysqlPrismaService,
  userId: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) throw new AppException('USER_NOT_FOUND');

  const [archives] = await prisma.$transaction([
    prisma.emailArchive.deleteMany({ where: { email: user.email } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  return { id: user.id, deletedEmailArchives: archives.count };
}
