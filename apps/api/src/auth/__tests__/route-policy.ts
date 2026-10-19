import { RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';
import { AdminGuard } from '../guards/admin.guard';

export type Policy = 'public' | 'auth' | 'admin' | 'public+admin';

/** 컨트롤러의 라우트별 접근 정책을 데코레이터 메타데이터에서 읽어 냅니다. */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function readRoutePolicies(controllers: Function[]) {
  const result: Record<string, Policy> = {};
  for (const controller of controllers) {
    const base = normalize(Reflect.getMetadata(PATH_METADATA, controller));
    const classPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller);
    const classGuards = Reflect.getMetadata(GUARDS_METADATA, controller) ?? [];

    const proto = controller.prototype;
    for (const name of Object.getOwnPropertyNames(proto)) {
      const handler = proto[name];
      if (typeof handler !== 'function') continue;
      const path = Reflect.getMetadata(PATH_METADATA, handler);
      if (path === undefined || name === 'constructor') continue;

      const method =
        RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler)];
      const guards = [
        ...classGuards,
        ...(Reflect.getMetadata(GUARDS_METADATA, handler) ?? []),
      ];
      const isPublic =
        Reflect.getMetadata(IS_PUBLIC_KEY, handler) ?? classPublic;
      const isAdmin = guards.includes(AdminGuard);

      const key = `${method} ${[base, normalize(path)].filter(Boolean).join('/') || '/'}`;
      result[key] =
        isPublic && isAdmin
          ? 'public+admin'
          : isPublic
            ? 'public'
            : isAdmin
              ? 'admin'
              : 'auth';
    }
  }
  return result;
}

function normalize(path: string | undefined) {
  return (path ?? '').replace(/^\/+|\/+$/g, '');
}
