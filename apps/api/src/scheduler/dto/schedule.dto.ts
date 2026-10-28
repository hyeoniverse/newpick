import { Type } from 'class-transformer';
import { IsDefined, IsInt, Max, Min, ValidateNested } from 'class-validator';

class ClockTimeDto {
  @IsInt({ message: '시는 정수여야 합니다' })
  @Min(0, { message: '시는 0~23이어야 합니다' })
  @Max(23, { message: '시는 0~23이어야 합니다' })
  hour: number;

  @IsInt({ message: '분은 정수여야 합니다' })
  @Min(0, { message: '분은 0~59여야 합니다' })
  @Max(59, { message: '분은 0~59여야 합니다' })
  minute: number;
}

class MailTimeDto extends ClockTimeDto {
  /** 0: 일요일 ~ 6: 토요일, 7: 매일 */
  @IsInt({ message: '요일은 정수여야 합니다' })
  @Min(0, { message: '요일은 0(일)~6(토) 또는 7(매일)이어야 합니다' })
  @Max(7, { message: '요일은 0(일)~6(토) 또는 7(매일)이어야 합니다' })
  day: number;
}

/** 예약 작업 시간 (#21): 기사 수집 · AI 요약 · 구독 메일 */
export class ScheduleDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => ClockTimeDto)
  crawl: ClockTimeDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => ClockTimeDto)
  summary: ClockTimeDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => MailTimeDto)
  mail: MailTimeDto;
}
