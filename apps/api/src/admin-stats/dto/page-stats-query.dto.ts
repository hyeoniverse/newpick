import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { DateRangeQueryDto } from 'src/common/dto/date-range-query.dto';

/** 통계: 한 페이지의 머문 곳 (#131) */
export class PageStatsQueryDto extends DateRangeQueryDto {
  @IsString()
  @Length(1, 120)
  @Matches(/^\//, { message: 'route는 /로 시작해야 합니다.' })
  route: string;

  @IsOptional()
  @IsIn(['mobile', 'tablet', 'desktop'])
  device?: 'mobile' | 'tablet' | 'desktop';
}
