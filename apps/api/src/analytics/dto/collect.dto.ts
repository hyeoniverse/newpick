import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** 브라우저 수집기가 보내는 페이지 한 번 보기의 누적 값 (#131). 묶음 값(sections · attention · clicks)은 서비스에서 다시 거른다 */
export class CollectDto {
  @Matches(/^[A-Za-z0-9_-]{8,32}$/)
  id: string;

  @Matches(/^[A-Za-z0-9_-]{8,32}$/)
  sessionId: string;

  @IsString()
  @MaxLength(255)
  @Matches(/^\//)
  path: string;

  @IsBoolean()
  entry: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  referrerHost?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmCampaign?: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  viewportW: number;

  @IsInt()
  @Min(0)
  @Max(24 * 60 * 60 * 1000)
  durationMs: number;

  @IsInt()
  @Min(0)
  @Max(100)
  scrollDepth: number;

  @IsOptional()
  @IsObject()
  sections?: Record<string, number>;

  @IsOptional()
  @IsArray()
  attention?: number[];

  @IsOptional()
  @IsArray()
  clicks?: unknown[];
}
