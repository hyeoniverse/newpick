import { Type } from 'class-transformer';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';

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

/** 본 것으로: newsletterId가 있으면 그 뉴스레터 상세에서 본 후속만 (null은 거부: Prisma에 그대로 가면 500) */
export class SeenDto {
  @ValidateIf((o) => o.newsletterId !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  newsletterId?: number;
}
