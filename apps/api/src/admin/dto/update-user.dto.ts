import { IsIn } from 'class-validator';

export const USER_ROLES = ['user', 'admin'] as const;

export class UpdateUserDto {
  @IsIn(USER_ROLES)
  role: (typeof USER_ROLES)[number];
}
