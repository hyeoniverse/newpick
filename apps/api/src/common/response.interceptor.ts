import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Response<T> {
  data: T;
  message?: string;
}

/**
 * 응답을 { statusCode, message, timestamp, dataCount, data } 모양으로 감싼다.
 * 전역이 아니라 컨트롤러에 직접 붙인다 (뉴스레터 · 분야 · 수집 · 편집): 웹이 이 경로들은 감싼 모양으로,
 * 나머지는 컨트롤러가 돌려준 모양({ message, data } 등) 그대로 읽는다. 전역으로 바꾸면 웹도 같이 고쳐야 한다
 */
@Injectable()
export class CommonResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((response: Response<unknown> | null | undefined) => {
        const statusCode: HttpStatus = context
          .switchToHttp()
          .getResponse().statusCode;
        const message = response?.message || '';
        // data가 null·0·빈 문자열이어도 그대로 둔다 (예전에는 || 로 응답 전체가 data에 들어갔다)
        const data =
          response && typeof response === 'object' && 'data' in response
            ? response.data
            : response;
        return {
          statusCode,
          message,
          timestamp: new Date().toISOString(),
          dataCount: Array.isArray(data) ? data.length : data == null ? 0 : 1,
          data,
        };
      }),
      // 오류는 여기서 바꾸지 않고 ApiExceptionFilter가 한 모양으로 만든다
    );
  }
}
