import { ArrayMaxSize, IsArray, IsInt, Min } from 'class-validator';

export class InterestsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Min(1, { each: true })
  interests: number[];
}
