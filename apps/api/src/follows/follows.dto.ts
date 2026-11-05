import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { WATCH_OFFSET } from './detect';

/** 후속 지켜보기: 뉴스레터 속 소식 하나 */
export class FollowStoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  newsletterId: number;

  /** 뉴스레터 안 소식 순서 (1부터). 관전 포인트는 WATCH_OFFSET + 순서 (1001부터) */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(WATCH_OFFSET + 20)
  storyIndex: number;
}
