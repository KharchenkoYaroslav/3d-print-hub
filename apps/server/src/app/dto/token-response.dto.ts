import { ApiProperty } from '@nestjs/swagger';
import { TokenResponse } from '@p3d-hub/shared-types';

export class TokenResponseDto implements TokenResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}
