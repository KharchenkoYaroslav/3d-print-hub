import { ApiProperty } from '@nestjs/swagger';

export class RefreshUserDto {
  @ApiProperty({ description: 'ID користувача' })
  sub!: string;

  @ApiProperty({ description: 'Refresh токен' })
  refreshToken!: string;
}

export class RefreshRequestDto {
  @ApiProperty({ type: RefreshUserDto, description: 'Інформація про користувача' })
  user!: RefreshUserDto;
}
