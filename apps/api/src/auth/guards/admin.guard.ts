import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AppException } from '../../common/errors/app.exception';

/**
 * 관리자 확인. JWT에는 role이 없으므로 매 요청마다 DB에서 확인합니다.
 * (role을 토큰에 넣으면 권한을 회수해도 토큰 만료 전까지 유지되기 때문)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: MysqlPrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userId = context.switchToHttp().getRequest().user?.id;
    if (!userId) throw new AppException('UNAUTHORIZED');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'admin') throw new AppException('ADMIN_ONLY');
    return true;
  }
}
