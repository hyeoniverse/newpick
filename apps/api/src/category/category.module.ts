import { Module } from '@nestjs/common';
import { LlmModule } from 'src/llm/llm.module';
import { FindCategoryService } from './find-category.service';
import { CategoryController } from './category.controller';
import { CategoryRepository } from './category.repository';

@Module({
	imports: [LlmModule],
	controllers: [CategoryController],
	// FindCategoryService: 기사 · 요약의 분야 고르기 (수집 · AI 요약이 쓴다)
	providers: [CategoryRepository, FindCategoryService],
	exports: [CategoryRepository, FindCategoryService],
})
export class CategoryModule {}
