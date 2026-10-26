import { HttpException } from '@nestjs/common';
import { ERROR_CODES, ErrorCode } from './error-codes';

/**
 * 서비스 오류는 이것으로 던진다: `throw new AppException('NEWSLETTER_NOT_FOUND')`.
 * 상태 코드와 기본 메시지는 ERROR_CODES에서 오고, 필요하면 message·details로 덮어쓴다
 */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: unknown,
  ) {
    const entry = ERROR_CODES[code];
    super({ code, message: message ?? entry.message, details }, entry.status);
  }
}
