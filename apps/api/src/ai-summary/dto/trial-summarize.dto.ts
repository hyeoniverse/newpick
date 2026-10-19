import { IsBoolean, IsDateString, IsInt, IsOptional } from 'class-validator';

export class TrialSummarizeDto {
  @IsDateString()
  dateStart: string;

  @IsDateString()
  dateEnd: string;

  @IsInt()
  categoryId: number;

  /** 이전 클라이언트 호환용. 값과 관계없이 항상 체험 모드로 처리합니다. */
  @IsOptional()
  @IsBoolean()
  test?: boolean;
}
