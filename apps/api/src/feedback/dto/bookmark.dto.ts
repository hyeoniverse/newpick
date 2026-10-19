import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

/**
 * 북마크 대상은 뉴스레터입니다. 프론트는 newsId와 newsletterId에 같은 값을 보내므로
 * newsletterId를 쓰고, 없으면 newsId를 씁니다.
 */
export class BookmarkDto {
  @ValidateIf((dto) => dto.newsId === undefined)
  @IsInt()
  @Min(1)
  newsletterId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  newsId?: number;

  get targetId(): number {
    return this.newsletterId ?? this.newsId;
  }
}
