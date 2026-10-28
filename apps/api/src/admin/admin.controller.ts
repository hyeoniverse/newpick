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
import { TagsService } from 'src/tags/tags.service';
import { MergeTagsDto, RemoveTagDto } from './dto/tags.dto';

@AdminOnly()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly siteCache: SiteCacheService,
    private readonly tags: TagsService,
  ) {}

  /** 태그 정돈 (#20): 합치기 · 지우기 규칙 목록 (태그 목록은 GET /newsletters/keywords/all) */
  @Get('tags/rules')
  async getTagRules() {
    return { message: '태그 규칙 조회 성공', data: await this.tags.rules() };
  }

  /** 태그 합치기 · 이름 바꾸기: 모든 뉴스레터에서 바꾸고 앞으로도 바꿔 쓴다. 사이트 캐시도 비운다 */
  @Post('tags/merge')
  @HttpCode(200)
  async mergeTags(@Body() body: MergeTagsDto) {
    const data = await this.tags.merge(body.from, body.to);
    await this.siteCache.refresh('태그 합치기');
    return { message: '태그를 합쳤습니다.', data };
  }

  /** 태그 지우기: 모든 뉴스레터에서 빼고 앞으로도 쓰지 않는다. 사이트 캐시도 비운다 */
  @Post('tags/remove')
  @HttpCode(200)
  async removeTag(@Body() body: RemoveTagDto) {
    const data = await this.tags.remove(body.tag);
    await this.siteCache.refresh('태그 지우기');
    return { message: '태그를 지웠습니다.', data };
  }

  /** 규칙 지우기 (이미 바꾼 태그는 그대로, 앞으로의 새 뉴스레터만) */
  @Delete('tags/rules/:id')
  async deleteTagRule(@Param('id', ParseIntPipe) id: number) {
    return {
      message: '규칙을 지웠습니다.',
      data: await this.tags.deleteRule(id),
    };
  }

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
