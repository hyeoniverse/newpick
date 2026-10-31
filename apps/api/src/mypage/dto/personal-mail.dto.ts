import { IsBoolean } from 'class-validator';

/** 맞춤 메일 켜기 · 끄기 (#123 16) */
export class PersonalMailDto {
  @IsBoolean({ message: 'enabled는 불리언이어야 합니다' })
  enabled: boolean;
}
