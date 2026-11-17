/**
 * catch로 받은 값의 메시지. catch는 무엇이든 받을 수 있어(unknown) Error가 아니면 글자로 바꾼다
 * (예전엔 error.message를 바로 읽어, Error가 아닌 값이면 undefined가 기록됐다)
 */
export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
