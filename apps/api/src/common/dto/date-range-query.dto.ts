import { IsOptional, Matches } from 'class-validator';

/** 관리자 화면 기간 (대시보드 · 통계) (KST 'YYYY-MM-DD'). 없으면 오늘, to가 없으면 from 하루 */
export class DateRangeQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from은 YYYY-MM-DD 형식이어야 합니다.',
  })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to는 YYYY-MM-DD 형식이어야 합니다.',
  })
  to?: string;
}
