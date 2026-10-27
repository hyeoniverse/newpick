import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';
import { UpdateUserDto } from './dto/update-user.dto';
import { SiteCacheService } from 'src/site-cache/site-cache.service';
import { AppException } from 'src/common/errors/app.exception';

@AdminOnly()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly siteCache: SiteCacheService,
  ) {}

  /** 사이트(웹) 캐시를 지금 비운다. 운영 데이터를 손으로 고친 뒤 쓴다 (#73) */
  @Post('site-cache/refresh')
  @HttpCode(200)
  async refreshSiteCache() {
    const result = await this.siteCache.refresh('관리자 수동');
    // strictNullChecks가 꺼져 있어 ok로는 좁혀지지 않아 reason 유무로 본다
    if ('reason' in result) {
      throw new AppException(
        result.reason === 'not-configured'
          ? 'SITE_CACHE_UNAVAILABLE'
          : 'SITE_CACHE_FAILED',
      );
    }
    return {
      message: '사이트 캐시를 비웠습니다.',
      data: { refreshedAt: new Date().toISOString() },
    };
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Get('bookmarks')
  async getBookmarks() {
    return this.adminService.getAllBookmarks();
  }

  /**
   * 사용자 권한 수정
   */
  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, updateDto);
  }
}
