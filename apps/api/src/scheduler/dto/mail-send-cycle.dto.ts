import { IsInt, Max, Min } from 'class-validator';

/** 이전에는 Number(hour) || 17이라 0시를 지정하면 17시가 되었습니다. */
export class MailSendCycleDto {
  @IsInt()
  @Min(0)
  @Max(23)
  hour: number;

  /** 0: 일요일 ~ 6: 토요일 */
  @IsInt()
  @Min(0)
  @Max(6)
  day: number;
}
