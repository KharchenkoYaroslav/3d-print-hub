import { ApiProperty } from '@nestjs/swagger';
import { UserLogin } from '@p3d-hub/shared-types';

export class UserLoginDto implements UserLogin {
  @ApiProperty({ description: 'Логін користувача' })
  login!: string;
}
