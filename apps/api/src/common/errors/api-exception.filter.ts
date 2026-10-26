import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { AppException } from './app.exception';
import { ERROR_CODES, ErrorCode, codeForStatus } from './error-codes';

/** 모든 오류 응답의 모양 */
export interface ApiErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string;
  /** 입력값 오류 목록 등 덧붙일 정보 */
  details?: unknown;
  path: string;
  timestamp: string;
}

interface Normalized {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

/** Prisma가 던지는 알려진 오류 (클래스를 직접 import하지 않고 모양으로 알아본다) */
const isPrismaKnownError = (
  e: unknown,
): e is { code: string; meta?: unknown } =>
  typeof e === 'object' &&
  e !== null &&
  (e as { name?: string }).name === 'PrismaClientKnownRequestError' &&
  typeof (e as { code?: unknown }).code === 'string';

const PRISMA_CODES: Record<string, ErrorCode> = {
  P2025: 'NOT_FOUND', // 바꾸거나 지울 행이 없음
  P2002: 'CONFLICT', // unique 겹침
  P2003: 'CONFLICT', // 연결된 행이 있어 지울 수 없음 / 없는 행을 가리킴
  P2000: 'VALIDATION_FAILED', // 값이 너무 김
};

/**
 * 오류를 하나의 모양({ statusCode, code, message, details?, path, timestamp })으로 바꾼다.
 * - AppException: 표의 code 그대로
 * - Nest 기본 예외(ValidationPipe·요청 제한·없는 주소 등): 상태 코드로 code를 정하고 메시지를 한국어로
 * - Prisma 오류: 404·409·400으로
 * - 그 밖의 오류: 500. 내부 메시지는 응답에 싣지 않고 로그·Sentry로만
 */
export function normalizeException(exception: unknown): Normalized {
  if (exception instanceof AppException) {
    const body = exception.getResponse() as {
      message: string;
      details?: unknown;
    };
    return {
      status: exception.getStatus(),
      code: exception.code,
      message: body.message,
      details: body.details,
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const raw =
      typeof response === 'string'
        ? response
        : (response as { message?: string | string[] }).message;

    // ValidationPipe: message가 배열 → 목록은 details로
    if (status === HttpStatus.BAD_REQUEST && Array.isArray(raw)) {
      return {
        status,
        code: 'VALIDATION_FAILED',
        message: ERROR_CODES.VALIDATION_FAILED.message,
        details: raw,
      };
    }
    // Nest 라우터의 "Cannot GET /x"
    if (
      status === HttpStatus.NOT_FOUND &&
      typeof raw === 'string' &&
      raw.startsWith('Cannot ')
    ) {
      return {
        status,
        code: 'ROUTE_NOT_FOUND',
        message: ERROR_CODES.ROUTE_NOT_FOUND.message,
      };
    }

    const code = codeForStatus(status);
    // 영어 기본 문구(Not Found, Forbidden resource, ThrottlerException 등)는 표의 한국어로.
    // 400의 영어 사유(ParseIntPipe 등)는 고칠 때 도움이 되므로 details로 남긴다
    const isKorean = typeof raw === 'string' && /[가-힣]/.test(raw);
    const keepReason =
      !isKorean && status === HttpStatus.BAD_REQUEST && typeof raw === 'string';
    return {
      status,
      code,
      message: isKorean ? raw : ERROR_CODES[code].message,
      ...(keepReason && { details: raw }),
    };
  }

  if (isPrismaKnownError(exception) && PRISMA_CODES[exception.code]) {
    const code = PRISMA_CODES[exception.code];
    return {
      status: ERROR_CODES[code].status,
      code,
      message: ERROR_CODES[code].message,
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_ERROR',
    message: ERROR_CODES.INTERNAL_ERROR.message,
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiError');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, code, message, details } = normalizeException(exception);

    if (status >= 500) {
      // 서버 쪽 문제만 기록 (4xx는 사용자 입력이라 기록하지 않는다). Sentry는 DSN이 없으면 아무 일도 하지 않음
      this.logger.error(
        `${request.method} ${request.url} → ${status} ${code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      Sentry.captureException(exception);
    }

    // 리다이렉트 등으로 이미 응답을 보냈으면 더 쓰지 않는다
    if (response.headersSent) return;

    const body: ApiErrorBody = {
      statusCode: status,
      code,
      message,
      ...(details !== undefined && { details }),
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }
}
