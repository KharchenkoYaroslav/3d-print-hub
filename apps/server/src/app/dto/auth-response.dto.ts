import { ApiProperty } from '@nestjs/swagger';
import { AuthResponse } from '@p3d-hub/shared-types';

export class AuthResponseDto implements AuthResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}
