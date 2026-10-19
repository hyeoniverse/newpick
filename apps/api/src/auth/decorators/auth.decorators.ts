import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';

export const IS_PUBLIC_KEY = 'isPublic';

/** 로그인 없이 호출할 수 있는 라우트. 전역 JwtAuthGuard를 건너뜁니다. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** 관리자만 호출할 수 있는 라우트. 로그인 확인 후 DB의 role을 확인합니다. */
export const AdminOnly = () => applyDecorators(UseGuards(AdminGuard));
