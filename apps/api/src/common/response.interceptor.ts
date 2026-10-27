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

@Injectable()
export class CommonResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response: Response<any>) => {
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
