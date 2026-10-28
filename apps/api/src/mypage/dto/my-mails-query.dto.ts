import { Type } from 'class-transformer';
import {
  IsDefined,
  IsISO8601,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

/** 내 뉴스레터(받은 메일) 쪽 단위 */
export class MyMailsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit는 정수여야 합니다' })
  @Min(1, { message: 'limit는 1 이상이어야 합니다' })
  @Max(20, { message: 'limit는 20 이하여야 합니다' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset는 정수여야 합니다' })
  @Min(0, { message: 'offset는 0 이상이어야 합니다' })
  offset?: number;
}

/** 받은 메일 한 통: 보낸 시각 (목록에서 받은 sentAt 그대로) */
export class MyMailQueryDto {
  @IsDefined({ message: 'sentAt이 필요합니다' })
  @IsISO8601({}, { message: 'sentAt은 ISO 시각이어야 합니다' })
  sentAt: string;
}
