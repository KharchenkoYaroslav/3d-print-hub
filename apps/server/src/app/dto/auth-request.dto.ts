import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ description: 'ID користувача' })
  sub!: string;
}

export class AuthRequestDto {
  @ApiProperty({ type: AuthUserDto, description: 'Інформація про користувача' })
  user!: AuthUserDto;
}
