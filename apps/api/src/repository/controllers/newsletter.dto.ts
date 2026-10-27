import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDefined,
  Min,
  IsNumberString,
  IsInt,
  IsString,
  IsIn,
  Length,
  Matches,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class NewsletterQueryDto {
  @IsDefined({ message: 'offset는 필수 값입니다' })
  @IsNumber({}, { message: 'offset는 숫자여야 합니다' })
  offset: number;

  @IsDefined({ message: 'limit는 필수 값입니다' })
  @IsNumber({}, { message: 'limit는 숫자여야 합니다' })
  limit: number;

  @IsOptional()
  @IsBoolean({ message: 'trend는 불리언이어야 합니다' })
  @Transform(({ obj, key, value }) => {
    const rawValue = obj[key];
    if (typeof rawValue === 'string') {
      return rawValue === 'true';
    }
    return value;
  })
  trend?: boolean;

  @IsOptional()
  @IsString({ message: 'startDate는 문자열이어야 합니다' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'endDate는 문자열이어야 합니다' })
  endDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'categoryId는 숫자여야 합니다' })
  categoryId?: number;
}
export class NewsletterBodyDto {
  @IsOptional()
  @IsString({ message: 'startDate는 문자열이어야 합니다' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'endDate는 문자열이어야 합니다' })
  endDate?: string;
}

export class NewsletterTrendDto {
  @IsOptional()
  @IsNumber({}, { message: 'categoryId는 숫자여야 합니다' })
  categoryId?: number;
}

export class NewsletterCategoryDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'offset는 숫자여야 합니다' })
  @IsDefined({ message: 'offset는 필수 값입니다' })
  offset: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'limit는 숫자여야 합니다' })
  @IsDefined({ message: 'limit는 필수 값입니다' })
  limit: number;
}

export class NewsletterRandomDto {
  @IsOptional()
  @IsNumberString({}, { message: 'num은 숫자여야 합니다' })
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'num은 정수여야 합니다' })
  @Min(1, { message: 'num은 1보다 커야 합니다' })
  num?: number;

  @IsOptional()
  @IsNumberString({}, { message: 'from은 숫자여야 합니다' })
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'from은 정수여야 합니다' })
  @Min(1, { message: 'from은 1보다 커야 합니다' })
  from?: number;
}

/** 지난 뉴스레터 검색 (#20). 검색어 · 키워드 · 관심사 · 기간(KST 날짜) · 정렬 · 페이지 */
export class NewsletterSearchDto {
  /** 검색어. 한국어 ngram(2글자) 색인이라 2글자 이상 */
  @IsOptional()
  @IsString({ message: '검색어는 문자열이어야 합니다' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(2, 50, { message: '검색어는 2~50자로 입력해 주세요' })
  q?: string;

  /** 뉴스레터 키워드(태그) 하나와 정확히 같은 것 */
  @IsOptional()
  @IsString({ message: 'keyword는 문자열이어야 합니다' })
  @Length(1, 30, { message: 'keyword는 1~30자여야 합니다' })
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId는 정수여야 합니다' })
  @Min(1, { message: 'categoryId는 1 이상이어야 합니다' })
  categoryId?: number;

  /** 시작 날짜 'YYYY-MM-DD' (KST, 그날 0시부터) */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from은 YYYY-MM-DD 형식이어야 합니다',
  })
  from?: string;

  /** 끝 날짜 'YYYY-MM-DD' (KST, 그날 끝까지) */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to는 YYYY-MM-DD 형식이어야 합니다',
  })
  to?: string;

  @IsOptional()
  @IsIn(['latest', 'popular'], {
    message: 'sort는 latest 또는 popular여야 합니다',
  })
  sort?: 'latest' | 'popular';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit는 정수여야 합니다' })
  @Min(1, { message: 'limit는 1 이상이어야 합니다' })
  @Max(50, { message: 'limit는 50 이하여야 합니다' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset는 정수여야 합니다' })
  @Min(0, { message: 'offset는 0 이상이어야 합니다' })
  offset?: number;
}

/** 자주 나온 키워드 (#20): 최근 며칠 · 몇 개 · 관심사 */
export class NewsletterKeywordsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'days는 정수여야 합니다' })
  @Min(1, { message: 'days는 1 이상이어야 합니다' })
  @Max(365, { message: 'days는 365 이하여야 합니다' })
  days?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit는 정수여야 합니다' })
  @Min(1, { message: 'limit는 1 이상이어야 합니다' })
  @Max(50, { message: 'limit는 50 이하여야 합니다' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId는 정수여야 합니다' })
  @Min(1, { message: 'categoryId는 1 이상이어야 합니다' })
  categoryId?: number;
}
