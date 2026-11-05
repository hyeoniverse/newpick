import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** 후속 지켜보기: 뉴스레터 속 소식 하나 */
export class FollowStoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  newsletterId: number;

  /** 뉴스레터 안 소식 순서 (1부터) */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  storyIndex: number;
}

/** 본 것으로: newsletterId가 있으면 그 뉴스레터 상세에서 본 후속만 */
export class SeenDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  newsletterId?: number;
}
