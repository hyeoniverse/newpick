import { IsBoolean, IsOptional } from 'class-validator';

/** 맞춤 메일 켜기 · 끄기 (#123 16) */
export class PersonalMailDto {
	@IsBoolean({ message: 'enabled는 불리언이어야 합니다.' })
	enabled!: boolean;
}

/** 속보 메일 받기 · 밤에도 바로 받기 (속보 뉴스레터 2단계). 보낸 것만 바꾼다 */
export class BreakingMailDto {
	@IsOptional()
	@IsBoolean({ message: 'enabled는 불리언이어야 합니다.' })
	enabled?: boolean;

	@IsOptional()
	@IsBoolean({ message: 'night는 불리언이어야 합니다.' })
	night?: boolean;
}
