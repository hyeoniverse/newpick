import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AppException } from './app.exception';
import { ApiExceptionFilter, normalizeException } from './api-exception.filter';
import { ERROR_CODES } from './error-codes';

describe('normalizeException: 모든 오류를 { status, code, message } 하나로', () => {
  it('AppException은 표의 상태·code·메시지', () => {
    expect(
      normalizeException(new AppException('NEWSLETTER_NOT_FOUND')),
    ).toEqual({
      status: 404,
      code: 'NEWSLETTER_NOT_FOUND',
      message: '뉴스레터를 찾을 수 없습니다.',
      details: undefined,
    });
  });

  it('AppException은 메시지·details를 덮어쓸 수 있다', () => {
    const e = new AppException(
      'INVALID_INTERESTS',
      '없는 분야가 있습니다: 99',
      {
        invalidCategoryIds: [99],
      },
    );
    expect(normalizeException(e)).toMatchObject({
      status: 400,
      code: 'INVALID_INTERESTS',
      message: '없는 분야가 있습니다: 99',
      details: { invalidCategoryIds: [99] },
    });
  });

  it('ValidationPipe 오류(메시지 배열)는 VALIDATION_FAILED + details', () => {
    const e = new BadRequestException(['limit must be a number']);
    expect(normalizeException(e)).toEqual({
      status: 400,
      code: 'VALIDATION_FAILED',
      message: ERROR_CODES.VALIDATION_FAILED.message,
      details: ['limit must be a number'],
    });
  });

  it('없는 API 주소("Cannot GET /x")는 ROUTE_NOT_FOUND', () => {
    expect(
      normalizeException(new NotFoundException('Cannot GET /nope')),
    ).toMatchObject({
      status: 404,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  it('요청 제한은 429 TOO_MANY_REQUESTS, 영어 기본 문구는 한국어로', () => {
    expect(normalizeException(new ThrottlerException())).toEqual({
      status: 429,
      code: 'TOO_MANY_REQUESTS',
      message: ERROR_CODES.TOO_MANY_REQUESTS.message,
    });
    expect(normalizeException(new ForbiddenException()).message).toBe(
      ERROR_CODES.FORBIDDEN.message,
    );
  });

  it('Nest 예외에 한국어 메시지를 주면 그대로 쓴다', () => {
    expect(
      normalizeException(new NotFoundException('발행본이 없습니다')).message,
    ).toBe('발행본이 없습니다');
  });

  it('Prisma 오류: 행 없음 404, 겹침 409', () => {
    const prisma = (code: string) =>
      Object.assign(new Error('prisma'), {
        name: 'PrismaClientKnownRequestError',
        code,
      });
    expect(normalizeException(prisma('P2025'))).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
    expect(normalizeException(prisma('P2002'))).toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
  });

  it('그 밖의 오류는 500, 내부 메시지는 응답에 싣지 않는다', () => {
    expect(
      normalizeException(new Error('connect ECONNREFUSED 10.0.0.3:3306')),
    ).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: ERROR_CODES.INTERNAL_ERROR.message,
    });
  });
});

describe('ApiExceptionFilter 응답', () => {
  const run = (exception: unknown, headersSent = false) => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, headersSent }),
        getRequest: () => ({ method: 'GET', url: '/newsletters/6' }),
      }),
    } as unknown as ArgumentsHost;
    new ApiExceptionFilter().catch(exception, host);
    return { status, json };
  };

  it('{ statusCode, code, message, path, timestamp } 모양으로 보낸다', () => {
    const { status, json } = run(new AppException('NEWSLETTER_NOT_FOUND'));
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'NEWSLETTER_NOT_FOUND',
      message: '뉴스레터를 찾을 수 없습니다.',
      path: '/newsletters/6',
      timestamp: expect.any(String),
    });
  });

  it('이미 응답을 보냈으면(리다이렉트 등) 다시 쓰지 않는다', () => {
    const { status } = run(new ForbiddenException(), true);
    expect(status).not.toHaveBeenCalled();
  });

  it('5xx만 서버 로그에 남긴다', () => {
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    run(new AppException('NEWSLETTER_NOT_FOUND'));
    expect(log).not.toHaveBeenCalled();
    const { status } = run(new Error('boom'));
    expect(status).toHaveBeenCalledWith(500);
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
