import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { AuthCredentials } from '@p3d-hub/shared-types';

export class AuthCredentialsDto implements AuthCredentials {
  @ApiProperty({ example: 'user_login', description: 'Логін користувача' })
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiProperty({ example: 'password123', description: 'Пароль користувача (мінімум 6 символів)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Пароль має містити мінімум 6 символів' })
  password!: string;
}
