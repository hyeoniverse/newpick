import { IsString, Length } from 'class-validator';

/** 태그 팔로우 (#123 5단계) */
export class TagFollowDto {
  @IsString()
  @Length(1, 64, { message: '태그는 1~64자여야 합니다' })
  tag: string;
}
