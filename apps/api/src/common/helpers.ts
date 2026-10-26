import { HttpStatus } from '@nestjs/common';
import { StatusMessage } from './interface';

export const getStatusMessage = (statusCode: HttpStatus): StatusMessage => {
  return {
    statusCode,
    message: HttpStatus[statusCode],
  };
};

export const getStatusMessageWithData = (
  statusCode: HttpStatus,
  data: any,
): StatusMessage => {
  return {
    statusCode,
    message: HttpStatus[statusCode],
    data,
  };
};

/** 매일 발송을 뜻하는 요일 값 (#55) */
export const EVERY_DAY = 7;

/**
 * 메일 발송 cron (초 분 시 일 월 요일). day: 0(일)~6(토), 7이면 매일.
 * 그 시각 40분에 보낸다: 뉴스레터 생성(매일 08:30)이 끝난 뒤에 나가도록 (#55)
 */
export function setTimeofCycle(hour: number, day: number): string {
  return `0 40 ${hour} * * ${day === EVERY_DAY ? '*' : day}`;
}
