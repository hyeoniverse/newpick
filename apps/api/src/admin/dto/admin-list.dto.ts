import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

/** 관리자 목록 공통: 쪽 단위 */
class AdminPageDto {
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

  /** 이메일 · 이름 일부 */
  @IsOptional()
  @IsString({ message: 'q는 문자열이어야 합니다' })
  @Length(1, 100, { message: 'q는 1~100자여야 합니다' })
  q?: string;
}

/** 사용자 목록 (#31): + 권한 */
export class AdminUsersQueryDto extends AdminPageDto {
  @IsOptional()
  @IsIn(['user', 'admin'], {
    message: 'role은 user · admin 중 하나여야 합니다',
  })
  role?: 'user' | 'admin';
}

/** 구독자 목록 (#31): + 구독 상태 · 관심사 */
export class AdminSubscribersQueryDto extends AdminPageDto {
  @IsOptional()
  @IsIn(['active', 'paused', 'cancelled'], {
    message: 'status는 active · paused · cancelled 중 하나여야 합니다',
  })
  status?: 'active' | 'paused' | 'cancelled';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId는 정수여야 합니다' })
  @Min(1, { message: 'categoryId는 1 이상이어야 합니다' })
  categoryId?: number;
}
