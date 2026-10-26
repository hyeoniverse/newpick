import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { deleteAccount } from 'src/common/delete-account';
import { AppException } from '../common/errors/app.exception';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  /** 회원 탈퇴와 같은 경로: 메일 발송 기록까지 함께 지운다 (#65) */
  async deleteUser(id: number) {
    return deleteAccount(this.prisma, id);
  }

  async getAllBookmarks() {
    return this.prisma.bookmark.findMany({
      include: {
        user: true, // 각 북마크와 관련된 사용자 정보 포함
      },
    });
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(id: number, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppException('USER_NOT_FOUND');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: updateDto.role },
    });
  }
}
