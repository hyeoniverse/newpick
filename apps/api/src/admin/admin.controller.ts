import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';
import { UpdateUserDto } from './dto/update-user.dto';

@AdminOnly()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
