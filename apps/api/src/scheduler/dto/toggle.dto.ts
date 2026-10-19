import { IsBoolean } from 'class-validator';

export class ToggleDto {
  @IsBoolean()
  enable: boolean;
}
