import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';

/**
 * AI 요약 지금 실행. date(YYYY-MM-DD, KST)를 주면 그날을 다시 만들고(빠진 날 채우기),
 * categoryId를 주면 그 분야만 (AI 기록에서 실패한 줄 다시 실행). 그날 이미 있는 분야는 건너뛴다
 */
export class ManualSummaryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  /** 이 뉴스레터를 다시 쓴다 (그 뉴스레터의 날 · 분야로, 새로 만들지 않고 바꾼다). date · categoryId보다 먼저 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  newsletterId?: number;
}
