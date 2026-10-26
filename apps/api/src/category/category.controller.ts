import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Body,
  UseInterceptors,
  Logger,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CommonResponseInterceptor } from '../common/response.interceptor';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AdminOnly, Public } from 'src/auth/decorators/auth.decorators';
import { AppException } from '../common/errors/app.exception';

@Controller('category')
@UseInterceptors(CommonResponseInterceptor)
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);
  constructor(private readonly categoryRepository: CategoryRepository) {}

  @Public()
  @Get()
  async findAll() {
    this.logger.log('findAll');
    const categories = await this.categoryRepository.findAll();
    return {
      data: categories,
      message: '카테고리 조회 완료',
    };
  }

  @Public()
  @Get(':id')
  async findById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    this.logger.log(`findById: ${id}`);
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    return {
      data: category,
      message: '카테고리 조회 완료',
    };
  }

  @Public()
  @Get('name/:name')
  async findByName(
    @Param(
      'name',
      new ValidationPipe({
        transform: false,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    name: string,
  ) {
    this.logger.log(`findByName: ${name}`);
    const category = await this.categoryRepository.findByName(name);
    if (!category) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    return {
      data: category,
      message: '카테고리 조회 완료',
    };
  }

  @AdminOnly()
  @Post()
  async create(
    @Body(
      new ValidationPipe({
        transform: false,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: CreateCategoryDto,
  ) {
    const category = await this.categoryRepository.findByName(dto.name);
    this.logger.log(`create: ${dto.name}`);
    if (category) {
      throw new AppException('CATEGORY_ALREADY_EXISTS');
    }
    const createdCategory = await this.categoryRepository.create(dto);
    this.logger.log(`create: ${createdCategory.id}`);
    return {
      data: createdCategory,
      message: '카테고리 생성 완료',
    };
  }

  @AdminOnly()
  @Put(':id')
  async update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body(
      new ValidationPipe({
        transform: false,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: CreateCategoryDto,
  ) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    this.logger.log(`update: ${id}`);
    const updatedCategory = await this.categoryRepository.update(id, dto);
    this.logger.log(`update: ${updatedCategory.id}`);
    return {
      data: updatedCategory,
      message: '카테고리 업데이트 완료',
    };
  }

  @AdminOnly()
  @Delete(':id')
  async delete(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    const deletedCategory = await this.categoryRepository.delete(id);
    this.logger.log(`delete: ${deletedCategory.id}`);
    return {
      data: deletedCategory,
      message: '카테고리 삭제 완료',
    };
  }
}
