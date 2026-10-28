import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
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
