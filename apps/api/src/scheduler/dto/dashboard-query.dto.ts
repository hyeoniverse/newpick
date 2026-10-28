import { Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** 관리자 대시보드 기간 (KST 'YYYY-MM-DD'). 없으면 오늘, to가 없으면 from 하루 */
export class DashboardQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from은 YYYY-MM-DD 형식이어야 합니다',
  })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to는 YYYY-MM-DD 형식이어야 합니다',
  })
  to?: string;
}

/** 그날 받은 사람 (KST 'YYYY-MM-DD') */
export class MailRecipientsQueryDto {
  @IsDefined({ message: 'date가 필요합니다' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date는 YYYY-MM-DD 형식이어야 합니다',
  })
  date: string;
}

/** 상세 목록 공통: 기간 + 페이지 (#21) */
export class DashboardListQueryDto extends DashboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit는 정수여야 합니다' })
  @Min(1, { message: 'limit는 1 이상이어야 합니다' })
  @Max(100, { message: 'limit는 100 이하여야 합니다' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset는 정수여야 합니다' })
  @Min(0, { message: 'offset는 0 이상이어야 합니다' })
  offset?: number;

  /** 표 머리 정렬: 열 이름 (목록마다 허용하는 열만 쓰고 나머지는 기본 순서) */
  @IsOptional()
  @Matches(/^[a-zA-Z]{1,20}$/, { message: 'sort는 열 이름이어야 합니다' })
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'order는 asc · desc 중 하나여야 합니다' })
  order?: 'asc' | 'desc';
}

/** 발행 목록: + 관심사 */
export class DashboardNewslettersQueryDto extends DashboardListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId는 정수여야 합니다' })
  @Min(1, { message: 'categoryId는 1 이상이어야 합니다' })
  categoryId?: number;
}

/** 발송 기록: + 이메일 일부 */
export class DashboardMailsQueryDto extends DashboardListQueryDto {
  @IsOptional()
  @IsString({ message: 'email은 문자열이어야 합니다' })
  @Length(1, 100, { message: 'email은 1~100자여야 합니다' })
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId는 정수여야 합니다' })
  @Min(1, { message: 'categoryId는 1 이상이어야 합니다' })
  categoryId?: number;
}

/** AI 기록: + 종류 · 결과 */
export class DashboardAiLogsQueryDto extends DashboardListQueryDto {
  @IsOptional()
  @IsIn(['summarization', 'category', 'edition'], {
    message: 'type은 summarization · category · edition 중 하나여야 합니다',
  })
  type?: 'summarization' | 'category' | 'edition';

  @IsOptional()
  @IsIn(['success', 'error'], {
    message: 'status는 success 또는 error여야 합니다',
  })
  status?: 'success' | 'error';
}

/** 실행 기록: + 작업 · 결과 */
export class DashboardJobRunsQueryDto extends DashboardListQueryDto {
  @IsOptional()
  @IsIn(['crawling', 'summary', 'mail'], {
    message: 'job은 crawling · summary · mail 중 하나여야 합니다',
  })
  job?: 'crawling' | 'summary' | 'mail';

  @IsOptional()
  @IsIn(['running', 'success', 'partial', 'failed', 'skipped'], {
    message: 'status가 올바르지 않습니다',
  })
  status?: string;
}

/** 수집 기사 (#31): + 관심사 · 언론사 · 제목 */
export class DashboardArticlesQueryDto extends DashboardListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId는 정수여야 합니다' })
  @Min(1, { message: 'categoryId는 1 이상이어야 합니다' })
  categoryId?: number;

  @IsOptional()
  @IsString({ message: 'source는 문자열이어야 합니다' })
  @Length(1, 50, { message: 'source는 1~50자여야 합니다' })
  source?: string;

  @IsOptional()
  @IsString({ message: 'title은 문자열이어야 합니다' })
  @Length(1, 100, { message: 'title은 1~100자여야 합니다' })
  title?: string;
}
