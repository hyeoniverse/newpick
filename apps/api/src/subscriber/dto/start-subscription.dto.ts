import { ArrayMaxSize, IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class StartSubscriptionDto {
  /** 생략하면 기존 관심사를 그대로 둡니다. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Min(1, { each: true })
  interests?: number[];
}
