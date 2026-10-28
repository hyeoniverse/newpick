import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Length,
} from 'class-validator';

/** 태그 합치기 (이름 바꾸기 포함): from 태그들을 to로 */
export class MergeTagsDto {
  @IsArray({ message: 'from은 배열이어야 합니다' })
  @ArrayMinSize(1, { message: '합칠 태그를 하나 이상 골라 주세요' })
  @ArrayMaxSize(50, { message: '한 번에 50개까지 합칠 수 있어요' })
  @IsString({ each: true, message: '태그는 문자열이어야 합니다' })
  @Length(1, 100, { each: true, message: '태그는 1~100자여야 합니다' })
  from: string[];

  @IsString({ message: 'to는 문자열이어야 합니다' })
  @Length(1, 30, { message: '새 이름은 1~30자여야 합니다' })
  to: string;
}

/** 태그 지우기 */
export class RemoveTagDto {
  @IsString({ message: 'tag는 문자열이어야 합니다' })
  @Length(1, 100, { message: '태그는 1~100자여야 합니다' })
  tag: string;
}
