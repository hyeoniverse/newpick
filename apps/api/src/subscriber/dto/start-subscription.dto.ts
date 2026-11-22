import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class StartSubscriptionDto {
	/**
	 * 생략하면 기존 관심사를 그대로 둡니다. 빈 배열은 받지 않습니다: 관심사가 0개면 구독 중이어도 메일이 가지 않는데,
	 * 예전 웹이 일시정지를 다시 켤 때 []를 보내 관심사가 모두 지워졌다
	 */
	@IsOptional()
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(50)
	@IsInt({ each: true })
	@Min(1, { each: true })
	interests?: number[];
}
