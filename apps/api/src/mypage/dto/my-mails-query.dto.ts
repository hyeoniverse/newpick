import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateIf,
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

  /** 중요 표시한 메일만 */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  starred?: boolean;

  /** 폴더: 'none'(폴더 없음) 또는 폴더 번호 */
  @IsOptional()
  @Matches(/^(none|\d+)$/)
  folder?: string;

  /** 관심사: 그 관심사 뉴스레터가 든 메일만 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  /** 최신순(desc) · 오래된순(asc) */
  @IsOptional()
  @IsIn(['desc', 'asc'])
  order?: 'desc' | 'asc';
}

/** 받은 메일 한 통 표시: 중요 · 폴더 (준 것만) */
export class MarkMailDto {
  @IsDefined({ message: 'sentAt이 필요합니다' })
  @IsISO8601({}, { message: 'sentAt은 ISO 시각이어야 합니다' })
  sentAt: string;

  @IsOptional()
  @IsBoolean()
  starred?: boolean;

  /** 옮길 폴더 (null = 폴더 없음) */
  @IsOptional()
  @ValidateIf((o) => o.folderId !== null)
  @IsInt()
  @Min(1)
  folderId?: number | null;
}

/** 북마크 폴더 옮기기 */
export class MoveBookmarksDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  @Min(1, { each: true })
  newsletterIds: number[];

  @ValidateIf((o) => o.folderId !== null)
  @IsInt()
  @Min(1)
  folderId: number | null;
}

/** 받은 메일 한 통: 보낸 시각 (목록에서 받은 sentAt 그대로) */
export class MyMailQueryDto {
  @IsDefined({ message: 'sentAt이 필요합니다' })
  @IsISO8601({}, { message: 'sentAt은 ISO 시각이어야 합니다' })
  sentAt: string;
}
