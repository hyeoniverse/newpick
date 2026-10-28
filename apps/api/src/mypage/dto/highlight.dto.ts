import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** 스크랩 저장 (#123): 뉴스레터 본문에서 고른 문장, 메모는 선택 */
export class CreateHighlightDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  newsletterId: number;

  /** 본문의 구역 (briefing · story-1 …) */
  @IsOptional()
  @Matches(/^[A-Za-z0-9_-]{1,40}$/)
  section?: string;

  @IsString()
  @MinLength(2, { message: '두 글자 이상 골라 주세요.' })
  @MaxLength(500, { message: '한 번에 500자까지 스크랩할 수 있어요.' })
  text: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: '메모는 2,000자까지 쓸 수 있어요.' })
  note?: string;
}

/** 메모 고치기 · 별표 켜고 끄기 (둘 중 준 것만 바꾼다). 메모가 빈 문자열이면 메모를 지운다 */
export class UpdateHighlightDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: '메모는 2,000자까지 쓸 수 있어요.' })
  note?: string;

  @IsOptional()
  @IsBoolean()
  starred?: boolean;
}

/** 여러 개 지우기 (한 번에 500개까지) */
export class DeleteHighlightsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];
}

export class HighlightsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  newsletterId?: number;
}

/** 선택한 스크랩 한꺼번에 바꾸기 (#123): 폴더로 옮기기 · 중요 표시 · 중요 빼기 */
export class BulkHighlightsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];

  @IsIn(['move', 'star', 'unstar'])
  action: 'move' | 'star' | 'unstar';

  /** move일 때 옮길 폴더. null이면 '폴더 없음' */
  @ValidateIf((o) => o.action === 'move' && o.folderId !== null)
  @IsInt()
  @Min(1)
  folderId?: number | null;
}

/** 폴더 만들기 · 이름 바꾸기 */
export class FolderDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: '폴더 이름을 적어 주세요.' })
  @MaxLength(30, { message: '폴더 이름은 30자까지예요.' })
  name: string;
}
