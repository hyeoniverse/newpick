import { IsEmail, Matches, MaxLength } from 'class-validator';

/** 이메일 바꾸기 1단계: 새 주소로 인증 코드 보내기 */
export class SendEmailCodeDto {
  @IsEmail({}, { message: '이메일 주소를 확인해 주세요.' })
  @MaxLength(191)
  email: string;
}

/** 이메일 바꾸기 2단계: 받은 6자리 코드 넣기 */
export class VerifyEmailCodeDto {
  @Matches(/^\d{6}$/, { message: '6자리 숫자를 넣어 주세요.' })
  code: string;
}
